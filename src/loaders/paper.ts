import {downloadPaperBuildJar, getPaperBuilds} from "../api/papermc";
import {getConfig} from "../utils/config";
import {checkBinForServerJar} from "../setup/02_mcloader";
import {copyServerJar} from "../utils/filesystem";
import {__log} from "../utils/logging";

export async function setupPaperServerJar(): Promise<void> {
  const config = getConfig()
  const builds = await getPaperBuilds(config.minecraft_version)

  if (!builds || !builds.length) throw new Error(`No Paper builds available for Minecraft Version ${config.minecraft_version}.`)

  const latestBuild = builds.pop()
  if (!latestBuild) throw new Error(`No latest build available for Minecraft Version ${config.minecraft_version}`)

  const alreadyHaveValidBuild = checkBinForServerJar(
    latestBuild.downloads.application.name,
    latestBuild.downloads.application.sha256
  )

  __log('Latest paper version:', latestBuild.downloads.application.name)
  __log('Needs downloading:', !alreadyHaveValidBuild)

  if (!alreadyHaveValidBuild) {
    await downloadPaperBuildJar(config.minecraft_version, latestBuild.build)
    __log('Downloaded latest paper version')
  }

  await copyServerJar(`./bin/loaders/${latestBuild.downloads.application.name}`, './server/server.jar')
}