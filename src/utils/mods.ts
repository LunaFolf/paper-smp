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

export async function checkIfModDownloaded(fileName: string): Promise<boolean> {
  return fs.existsSync('./bin/mods/' + fileName)
}

export async function downloadMods(): Promise<void> {
  const config = getConfig();

  if (!canLoaderUseMods(config.mod_loader)) {
    __error(
      $t('errors.modloaders.mods_not_supported')
    )
    return
  }

  if (!config.mods || !config.mods.modrinth) {
    __log(
      $t('info.no_mods_detected')
    )
    return
  }

  const modsToCopy: string[] = []

  await checkForModrinthMods(config.mods.modrinth).then(mods => {
    mods.forEach(mod => {
      if (!modsToCopy.includes(mod)) modsToCopy.push(mod)
    })
  })

  /**
   * Remove existing server mods, copy new ones and also copy manual ones.
   */
  const existingModFiles = fs.readdirSync(serverModsPath).filter(file => file.endsWith('.jar'))
  for (const file of existingModFiles) {
    __log('Removing Server mods Jar', file)
    fs.rmSync(`${serverModsPath}/${file}`)
  }

  for (const file of modsToCopy) {
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

  await createImportableZIP([
    ...modsToCopy.map(f => `${binModsPath}/${f}`),
    ...manualModFiles.map(f => `${manualModsPath}/${f}`)
  ], 'modExport.zip')
}

export async function checkForModrinthMods(mods: ModrinthProject["id"][]): Promise<string[]> {
  const config = getConfig();

  const modNames: string[] = []

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
      break
    }

    __log(
      $t('info.checking.mod', { modName: resource.name })
    )

    const mods = await downloadModrinthMod(resource)

    modNames.push(...mods)
  }

  return modNames
}

export async function downloadModrinthMod (resource: ModrinthProjectVersion): Promise<string[]> {
  if (!resource) {
    __error(
      $t('errors.modloaders.modrinth.missing_resource')
    )
  }

  const modNames: string[] = []

  modNames.push(resource.files[0].filename)

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
        break
      }

      const mods = await downloadModrinthMod(dependencyResource)

      modNames.push(...mods)
    }
  }

  const alreadyDownloaded = await checkIfModDownloaded(resource.files[0].filename)

  if (alreadyDownloaded) return modNames

  __log(
    $t('info.downloading.mod', { modName: resource.name })
  )

  await downloadModrinthProject(resource, 'mod')

  return modNames
}