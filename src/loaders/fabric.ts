import fs from "fs";
import {getConfig} from "../utils/config";
import {downloadFabricServerJar, getFabricInstallers, getFabricLoaders} from "../api/fabric";
import {checkBinForServerJar} from "../setup/02_mcloader";
import {$t} from "../utils/translations";
import {copyServerJar, createManifest} from "../utils/filesystem";
import {__log} from "../utils/logging";

export async function setupFabricServerJar(): Promise<void> {
  const config = getConfig()
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

  __log('Latest fabric version:', assumedFileName)
  __log('Needs downloading:', !alreadyHaveValidBuild)

  if (!alreadyHaveValidBuild) {
    await downloadFabricServerJar(
      config.minecraft_version,
      latestLoader.loader.version,
      latestInstaller.version
    )
    __log('Downloaded latest fabric version')
  }

  await copyServerJar(`./bin/loaders/${assumedFileName}`, './server/server.jar')

  await createManifest({
    minecraft: {
      version: config.minecraft_version,
      modLoaders: [
        {
          id: `fabric-${latestLoader.loader.version}`,
          primary: true
        }
      ]
    },
    manifestType: "minecraftModpack",
    manifestVersion: 1,
    name: "MineWeave",
    author: "Your mom",
    files: [],
    overrides: "overrides"
  })
}