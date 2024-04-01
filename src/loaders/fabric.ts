import fs from "fs";
import {getConfig} from "../utils/config";
import {downloadFabricServerJar, getFabricInstallers, getFabricLoaders} from "../api/fabric";
import {checkBinForServerJar} from "../setup/02_mcloader";
import {$t} from "../utils/translations";
import {copyServerJar} from "../utils/filesystem";

const config = getConfig()

export async function setupFabricServerJar(): Promise<void> {
  const loaders = await getFabricLoaders(config.minecraft_version)
  if (!loaders || !loaders.length) throw new Error(
    $t('errors.no_builds.fabric', { version: config.minecraft_version })
  )

  const latestLoader = (
    loaders.filter(l => l.loader.stable)[0] || loaders[0]
  )

  if (!latestLoader) throw new Error(
    $t('errors.no_builds.fabric', { version: config.minecraft_version })
  )

  const installers = await getFabricInstallers()
  if (!installers) throw new Error(
    $t('errors.no_installer.fabric', { version: config.minecraft_version })
  )

  const latestInstaller = (
    installers.filter(i => i.stable)[0] || installers[0]
  )

  const assumedFileName = (
    `fabric-${config.minecraft_version}-${latestLoader.loader.version}-${latestInstaller.version}.jar`
  )

  const alreadyHaveValidBuild = checkBinForServerJar(assumedFileName)

  console.log('Latest fabric version:', assumedFileName)
  console.log('Needs downloading:', !alreadyHaveValidBuild)

  if (!alreadyHaveValidBuild) {
    await downloadFabricServerJar(
      config.minecraft_version,
      latestLoader.loader.version,
      latestInstaller.version
    )
    console.log('Downloaded latest fabric version')
  }

  await copyServerJar(`./bin/loaders/${assumedFileName}`, './server/server.jar')
}