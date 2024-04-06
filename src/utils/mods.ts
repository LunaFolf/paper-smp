import {getConfig} from "./config";
import {canLoaderUseMods} from "./server";
import {$t} from "./translations";
import {downloadModrinthProject, getModrinthProjectCompatibleVersion} from "../api/modrinth";
import fs from "fs";
import {__error, __log} from "./logging";
import {createImportableZIP} from "./filesystem";

const serverModsPath = "./server/mods";
const binModsPath = "./bin/mods";
const manualModsPath = "./manual_mods";

export async function clearCachedMods (): Promise<void> {
  fs.readdir('./bin/mods', (err, files) => {
    for (const file of files) {
      fs.rmSync(`./bin/mods/` + file)
    }
  })
}

export async function downloadMods(): Promise<boolean> {
  const config = getConfig();
  let pauseAndWaitBeforeServerStart = false

  if (!canLoaderUseMods(config.mod_loader)) {
    __error(
      $t('errors.modloaders.mods_not_supported')
    )

    return pauseAndWaitBeforeServerStart
  }

  if (!config.mods || !config.mods.modrinth) {
    __log(
      $t('info.no_mods_detected')
    )

    return pauseAndWaitBeforeServerStart
  }

  await clearCachedMods()

  await checkForModrinthMods(config.mods.modrinth)
    .then(pauseAndWait => pauseAndWaitBeforeServerStart = pauseAndWait)

  /**
   * Remove existing server mods, copy new ones and also copy manual ones.
   */
  const existingModFiles = fs.readdirSync(serverModsPath).filter(file => file.endsWith('.jar'))
  for (const file of existingModFiles) {
    __log('Removing Server mods Jar', file)
    fs.rmSync(`${serverModsPath}/${file}`)
  }

  const newModFiles = fs.readdirSync(binModsPath);
  for (const file of newModFiles) {
    __log('Copying to server mods', file);
    try {
      fs.copyFileSync(`${binModsPath}/${file}`, `${serverModsPath}/${file}`);
    } catch (error) {
      __error('Error copying mod Jar', error);
    }
  }
  const manualModFiles = fs.readdirSync(manualModsPath)
  for (const file of manualModFiles) {
    __log('Copying to server manual mods', file)
    fs.copyFileSync(`${manualModsPath}/${file}`, `${serverModsPath}/${file}`, fs.constants.COPYFILE_EXCL)
  }

  createImportableZIP([
    ...newModFiles.map(f => `${binModsPath}/${f}`),
    ...manualModFiles.map(f => `${manualModsPath}/${f}`)
  ], 'modExport.zip')

  return pauseAndWaitBeforeServerStart
}

export async function checkForModrinthMods(mods: ModrinthProject["id"][]): Promise<boolean> {
  const config = getConfig();
  let pauseAndWait = false

  for (const resourceID of mods) {
    const resource = await getModrinthProjectCompatibleVersion(
      resourceID,
      [config.mod_loader],
      [config.minecraft_version]
    )

    if (!resource) {
      __error(
        $t('errors.modloaders.modrinth.unable_to_find', { resourceID })
      )
      pauseAndWait = true
      break
    }

    __log(
      $t('info.downloading.mod', { modName: resource.name })
    )

    const success = await downloadModrinthMod(resource)
    pauseAndWait = !success

  }

  return pauseAndWait
}

export async function downloadModrinthMod (resource: ModrinthProjectVersion): Promise<boolean> {
  let pauseAndWait = false
  if (!resource) {
    __error(
      $t('errors.modloaders.modrinth.missing_resource')
    )
  }

  for (const dependency of resource.dependencies) {
    const config = getConfig()
    if (resource.project_id && ["required"].includes(dependency.dependency_type)) {
      const dependencyResource = await getModrinthProjectCompatibleVersion(
        dependency.project_id as string,
        [config.mod_loader],
        [config.minecraft_version]
      )

      if (!dependencyResource) {
        __error(
          $t('errors.modloaders.modrinth.unable_to_find', { resourceID: resource.project_id })
        )
        pauseAndWait = true
        break
      }

      __log(
        $t('info.downloading.mod', { modName: dependencyResource.name })
      )

      const dependencySuccess = await downloadModrinthMod(dependencyResource)
      pauseAndWait = !dependencySuccess || pauseAndWait
    }
  }

  pauseAndWait = await downloadModrinthProject(resource, 'mod') || pauseAndWait

  return pauseAndWait
}