import fs from "fs";
import {downloadPaperBuildJar, getPaperBuilds} from "../api/papermc";
import {getConfig} from "../utils/config";
import {checkBinForServerJar} from "../setup/02_mcloader";
import {copyServerJar} from "../utils/filesystem";

const config = getConfig()

export async function setupPaperServerJar(): Promise<void> {
  const builds = await getPaperBuilds(config.minecraft_version)

  if (!builds || !builds.length) throw new Error(`No Paper builds available for Minecraft Version ${config.minecraft_version}.`)

  const latestBuild = builds.pop()
  if (!latestBuild) throw new Error(`No latest build available for Minecraft Version ${config.minecraft_version}`)

  const alreadyHaveValidBuild = checkBinForServerJar(
    latestBuild.downloads.application.name,
    latestBuild.downloads.application.sha256
  )

  console.log('Latest paper version:', latestBuild.downloads.application.name)
  console.log('Needs downloading:', !alreadyHaveValidBuild)

  if (!alreadyHaveValidBuild) {
    await downloadPaperBuildJar(config.minecraft_version, latestBuild.build)
    console.log('Downloaded latest paper version')
  }

  await copyServerJar(`./bin/loaders/${latestBuild.downloads.application.name}`, './server/server.jar')
}