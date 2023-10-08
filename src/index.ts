import {downloadResource, getResource} from "./api/spigot";

require('dotenv').config()

import yaml from 'yaml'
import crypto from 'crypto'
import fs from 'fs'
import { downloadBuildJar, getBuilds } from "./api/papermc"
import { spawn } from 'child_process'
import {downloadAssetJar, getReleases} from "./api/essentialsx";
import {downloadFloodgate, downloadGeyser, getLatestFloodgate, getLatestGeyser} from "./api/geyser";
import {waitForKey} from "./utils/input"

type serverConfig = {
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


const config: serverConfig = yaml.parse(fs.readFileSync('./server-config.yml').toString())
const minecraftVersion: string = '1.20.1' // TODO: Move this to somewhere that isn't code.
const serverFilesPath: string = './server'

if (!fs.existsSync(serverFilesPath)) fs.mkdirSync(serverFilesPath)
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

async function setupActiveJar (minecraftVersion: string) {
  const builds = await getBuilds(minecraftVersion)
  if (!builds) throw new Error(`No builds available for ${minecraftVersion}`)

  const latestBuild = builds.pop()
  if (!latestBuild) throw new Error(`No latest build available for ${minecraftVersion}`)

  const haveValidBuild = checkBinForPaperVersion(
    latestBuild.downloads.application.name,
    latestBuild.downloads.application.sha256
  )

  if (!haveValidBuild) await downloadBuildJar(minecraftVersion, latestBuild.build)

  if (fs.existsSync('./server/paper.jar')) fs.rmSync('./server/paper.jar')

  fs.copyFileSync(`./bin/papermc/${latestBuild.downloads.application.name}`, './server/paper.jar')
}

// Setup up paper jar we gonna be using
setupActiveJar(minecraftVersion).then(async () => {
  fs.readdir('./bin/plugins', (err, files) => {
    for (const file of files) {
      fs.rmSync(`./bin/plugins/` + file)
    }
  })

  const essentialsBuild = await checkForLatestEssentialPlugins()
  const enabledPlugins = (process.env.ESSENTIALSX_PLUGINS || '').split(',')

  essentialsBuild.assets.forEach(asset => {
    if (enabledPlugins.some(enabledAsset => {
      return asset.name.startsWith(enabledAsset + '-')
    })) downloadAssetJar(essentialsBuild.tag_name, asset.name)
  })

  const { latestGeyser, latestFloodgate } = await checkForLatestGeyser()

  await downloadGeyser(latestGeyser.version, latestGeyser.build)
  await downloadFloodgate(latestFloodgate.version, latestFloodgate.build)

  const waitBeforeStart = await checkForOtherPlugins()
  if (!fs.existsSync('./server/plugins')) fs.mkdirSync('./server/plugins')
  fs.readdir('./bin/plugins', (err, files) => {
    for (const file of files) {
      fs.copyFileSync('./bin/plugins/' + file, './server/plugins/' + file, fs.constants.COPYFILE_FICLONE)
    }
  })

  fs.writeFileSync('./server/eula.txt','#suck it\n#microsoft\neula=false') // Is this legal??

  await new Promise((r) => { setTimeout(r, 1000) })

  fs.writeFileSync('./server/eula.txt', '#suck it\n#microsoft\neula=true') // Probably not lol

  console.log('[PAUSED] press ENTER to continue...')
  await waitForKey()

  console.log('Starting Server')

  const child = spawn('java', [
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

  child.stdout.on('data', data => {
    console.log(data.toString())
  })

  child.on('exit', (code, signal) => {
    console.log(`Server exited with code ${code},  signal ${signal}`)
  })

  child.on('error', (err) => {
    console.error('Failed to start server')
    console.error(err)
  })
})