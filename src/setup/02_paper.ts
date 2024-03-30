import {getConfig} from "../utils/config";
import {downloadBuildJar, getBuilds} from "../api/papermc";
import fs from "fs";
import crypto from "crypto";

const config = getConfig()

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

export async function setupPaperServerJar(): Promise<void> {
  const builds = await getBuilds(config.minecraft_version)

  if (!builds || !builds.length) throw new Error(`No builds available for Minecraft Version ${config.minecraft_version}.`)

  const latestBuild = builds.pop()
  if (!latestBuild) throw new Error(`No latest build available for Minecraft Version ${config.minecraft_version}`)

  const alreadyHaveValidBuild = checkBinForPaperVersion(
    latestBuild.downloads.application.name,
    latestBuild.downloads.application.sha256
  )

  console.log('Latest paper version:', latestBuild.downloads.application.name)
  console.log('Needs downloading:', !alreadyHaveValidBuild)

  if (!alreadyHaveValidBuild) {
    await downloadBuildJar(config.minecraft_version, latestBuild.build)
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