require('dotenv').config()
require('colors')

import type from 'colors'

import yaml from 'yaml'
import crypto from 'crypto'
import fs from 'fs'
import { downloadBuildJar, getBuilds } from "./api/papermc"
import { spawn } from 'child_process'
import {downloadAssetJar, getReleases} from "./api/essentialsx";
import {adoptArch, adoptOS, downloadJRE, getAssets} from "./api/adoptium";
import {downloadFloodgate, downloadGeyser, getLatestFloodgate, getLatestGeyser} from "./api/geyser";
import {downloadResource, getResource} from "./api/spigot";
import {waitForKey} from "./utils/input"

// TODO: get this into an import, without the IDE giving a fucking error
const decompress = require('decompress')
const { textSync } = require('figlet')

type serverConfig = {
  minecraft_version: string,
  plugins: {
    essentials_x: string[],
    other: {
      [key: string]: {
        name: string,
        source: 'spigot',
        id: number | string
      }
    }
  }
}

if (!fs.existsSync('./server-config.yml')) {
  // Create a default server config file
  fs.writeFileSync('./server-config.yml', yaml.stringify({
    minecraft_version: '1.20.1',
    plugins: {
      essentials_x: [
        'EssentialsX',
        'EssentialsXChat',
        'EssentialsXGeoIP',
        'EssentialsXSpawn'
      ],
      other: {
        g_sit: {
          name: 'GSit',
          source: 'spigot',
          id: 62325
        }
      }
    }
  }))
}

const config: serverConfig = yaml.parse(fs.readFileSync('./server-config.yml').toString())
const serverFilesPath: string = './server'

if (!fs.existsSync(serverFilesPath)) fs.mkdirSync(serverFilesPath)
if (!fs.existsSync('./bin')) fs.mkdirSync('./bin')
if (!fs.existsSync('./bin/papermc')) fs.mkdirSync('./bin/papermc')
if (!fs.existsSync('./bin/plugins')) fs.mkdirSync('./bin/plugins')

function checkBinForPaperVersion (jarFileName: string, checksum?: string) {
  const filePath = `./bin/papermc/${jarFileName}`
  const binHasFile = fs.existsSync(filePath)

  if (!binHasFile) return false

  if (checksum) {
    const hash = crypto.createHash('sha256')
      .update(fs.readFileSync(filePath))
      .digest('hex')

    if (hash !== checksum) return false
  }

  return true
}

async function checkForLatestEssentialPlugins () {
  const releases = await getReleases()

  if (!releases) throw new Error(`No releases available`)

  const latestRelease = releases[0]
  if (!latestRelease) throw new Error(`No latest release available`)

  return latestRelease
}
async function checkForLatestGeyser () {
  const latestGeyser = await getLatestGeyser()
  const latestFloodgate = await getLatestFloodgate()

  if (!latestGeyser || !latestFloodgate) throw new Error(`No releases available`)

  return {latestGeyser, latestFloodgate}
}

async function checkForOtherPlugins (): Promise<boolean> {
  const otherPlugins = config.plugins.other

  let manualDownloadRequired = false

  for (const pluginKey of Object.keys(otherPlugins)) {
    const plugin = otherPlugins[pluginKey]
    console.log('Checking', plugin.name)

    let resource

    switch (plugin.source) {
      case "spigot":
        resource = await getResource(Number(plugin.id))
        break
      default:
        console.error('Unknown download source for', plugin.name, ':', plugin.source)
    }

    if (resource) {
      if (resource?.external) {
        const url = new URL(resource.file.externalUrl)
        const hostSplit = url.host.split('.')
        const site = hostSplit[hostSplit.length - 2].toLowerCase()

        switch (site) {
          case "patreon":
            console.error('Manual download required, you can download', plugin.name, 'from the URL here:', resource.file.externalUrl)
            console.error('[We\'ll pause the server launch for you so you have time to download it, to opt out of this use --no-pause]')

            manualDownloadRequired = true
            break
          default:
            console.error('Unknown external source', site)
        }
      } else {
        switch (plugin.source) {
          case "spigot":
            await downloadResource(resource.id, (pluginKey + '.jar'))
        }
      }
    } else {
      console.error('Could not find', plugin.name, 'via source', plugin.source)
    }
  }

  return manualDownloadRequired
}

async function setupActiveJar (minecraftVersion: string): Promise<void> {
  const builds = await getBuilds(minecraftVersion)
  if (!builds) throw new Error(`No builds available for ${minecraftVersion}`)

  const latestBuild = builds.pop()
  if (!latestBuild) throw new Error(`No latest build available for ${minecraftVersion}`)

  const haveValidBuild = checkBinForPaperVersion(
    latestBuild.downloads.application.name,
    latestBuild.downloads.application.sha256
  )

  console.log('Latest paper version:', latestBuild.downloads.application.name)
  console.log('Needs downloading:', !haveValidBuild)

  if (!haveValidBuild) {
    await downloadBuildJar(minecraftVersion, latestBuild.build)
    console.log('Downloaded latest paper version')
  }

  if (fs.existsSync('./server/paper.jar')) fs.rmSync('./server/paper.jar')

  console.log('Copying', latestBuild.downloads.application.name, 'to ./server/paper.jar')
  return new Promise((resolve, reject) => {
    fs.copyFile(`./bin/papermc/${latestBuild.downloads.application.name}`, './server/paper.jar', (error) => {
      if (error) reject(error)
      resolve()
    })
  })
}

async function checkForOpenJRE(): Promise<string | void> {
  if (!fs.existsSync('./bin/openjre')) fs.mkdirSync('./bin/openjre')

  const _arch = process.arch
  const _platform = process.platform

  let arch: adoptArch
  let platform: adoptOS

  switch (_arch) {
    case "arm64":
    case "ia32":
    case "mips":
    case "mipsel":
    case "ppc":
    case "s390":
      console.error(_arch, 'architecture is not supported by AdoptOpenJDK')
      return
    default:
      arch = _arch
      break
  }

  switch (_platform) {
    case "win32":
      platform = "windows"
      break
    case "android":
    case "darwin":
    case "freebsd":
    case "haiku":
    case "openbsd":
    case "sunos":
    case "cygwin":
    case "netbsd":
      console.error(_platform, 'platform is not supported by AdoptOpenJDK')
      return
    default:
      platform = _platform
      break
  }

  const jreAsset = await getAssets(arch, platform)

  if (!jreAsset) {
    console.error('Unable to find available JRE for', platform, arch)
    return
  }

  const jrePath = jreAsset.release_name + '-jre'

  if (!fs.existsSync('./bin/openjre/' + jrePath)) {
    const packagePath = './bin/openjre/' + jreAsset.binary.package.name
    await downloadJRE(jreAsset.binary.package.link, jreAsset.binary.package.name)
    await decompress('./bin/openjre/' + jreAsset.binary.package.name, './bin/openjre/')
    fs.rmSync(packagePath)
  }

  return jrePath

}

// Setup up paper jar we gonna be using
setupActiveJar(config.minecraft_version).then(async () => {
  const javaPath = await checkForOpenJRE()

  if (!javaPath) throw new Error('Unable to find java exec, wah wah')

  fs.readdir('./bin/plugins', (err, files) => {
    for (const file of files) {
      fs.rmSync(`./bin/plugins/` + file)
    }
  })

  const essentialsBuild = await checkForLatestEssentialPlugins()

  essentialsBuild.assets.forEach(asset => {
    const isEssentialsAssetEnabled = config.plugins.essentials_x.some(enabledAsset => asset.name.startsWith(enabledAsset + '-'))
    if (isEssentialsAssetEnabled) {
      console.log('Downloading', asset.name)
      downloadAssetJar(essentialsBuild.tag_name, asset.name)
    }
  })

  const { latestGeyser, latestFloodgate } = await checkForLatestGeyser()

  console.log('Downloading Geyser', latestGeyser.version, latestGeyser.build)
  await downloadGeyser(latestGeyser.version, latestGeyser.build)

  console.log('Downloading Floodgate', latestFloodgate.version, latestFloodgate.build)
  await downloadFloodgate(latestFloodgate.version, latestFloodgate.build)

  const waitBeforeStart = await checkForOtherPlugins()
  if (!fs.existsSync('./server/plugins')) fs.mkdirSync('./server/plugins')

  const existingPluginFiles = fs.readdirSync('./server/plugins').filter(file => file.endsWith('.jar'))
  for (const file of existingPluginFiles) {
    console.log('Removing Plugin Jar', file)
    fs.rmSync('./server/plugins/' + file)
  }

  const newPluginFiles = fs.readdirSync('./bin/plugins')
  for (const file of newPluginFiles) {
    console.log('Copying to server plugins', file)
    fs.copyFileSync('./bin/plugins/' + file, './server/plugins/' + file, fs.constants.COPYFILE_FICLONE)
  }

  fs.writeFileSync('./server/eula.txt','#suck it\n#microsoft\neula=true') // Is this legal??

  if (waitBeforeStart) {
    console.log('[PAUSED] press ENTER to continue...')
    await waitForKey()
  }

  console.log(textSync('Starting Server', "Big Money-se").rainbow)

  let javaExec = '../bin/openjre/' + javaPath + '/bin/java'
  switch (process.platform) {
    case "win32":
      javaExec = javaExec + '.exe'
      break
  }

  const child = spawn(javaExec, [
    '-Xms5000M',
    '-Xmx5000M',
    '-jar',
    'paper.jar',
    'nogui'
  ], {
    cwd: './server',
    stdio: [
      'inherit',
      'pipe',
      'inherit'
    ]
  })

  const timestampRegex = /^\[\d{2}:\d{2}:\d{2} \D{4}]/is // [00:00:00 INFO]
  const titleRegex = /\[\D+?]/gi // [Essentials] [Vault] [Harbor] etc

  child.stdout.on('data', data => {
    let messageString = data.toString()
    if (messageString.endsWith('\n')) messageString = messageString.substring(0, messageString.length - 1)

    messageString.split('\n').forEach((message: string) => {
      const isLogMessage = timestampRegex.test(message)

      const msgObj = {
        type: isLogMessage ? message.substring(10, 14) : 'SYSTEM',
        message: isLogMessage ? message.substring(17) : message,
        raw: message
      }

      if (msgObj.type === 'SYSTEM') msgObj.message = msgObj.message.bgYellow.black
      else if (msgObj.type === 'WARN') msgObj.message = msgObj.message.yellow
      else if (msgObj.type === 'ERRO') msgObj.message = msgObj.message.red

      else if (msgObj.message.startsWith('Environment: ')) msgObj.message = msgObj.message.bgMagenta
      else if (msgObj.message.endsWith('For help, type "help"')) {
        console.log(textSync('Server Started!', "Big Money-ne").yellow)
      }

      if (titleRegex.test(msgObj.message)) {
        msgObj.message = msgObj.message.replaceAll(titleRegex, (match) => {
          return match.bgCyan.black
        })
      }

      console.log(msgObj.message)
    })
  })

  child.on('exit', (code, signal) => {
    console.log(`Server exited with code ${code},  signal ${signal}`)
  })

  child.on('error', (err) => {
    console.error('Failed to start server')
    console.error(err)
  })
})