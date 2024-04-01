import {getConfig, getGameMainVersion} from "./config";
import {canLoaderUseMods} from "./server";
import {$t} from "./translations";
import {downloadModrinthProject, getModrinthProjectCompatibleVersion} from "../api/modrinth";
import {downloadModrinthPlugin} from "./plugins";

const config = getConfig()

export async function downloadMods(): Promise<boolean> {
  let pauseAndWaitBeforeServerStart = false

  if (!canLoaderUseMods(config.mod_loader)) {
    console.error(
      $t('errors.modloaders.mods_not_supported')
    )

    return pauseAndWaitBeforeServerStart
  }

  if (!config.mods || !config.mods.modrinth) {
    console.log(
      $t('info.no_mods_detected')
    )

    return pauseAndWaitBeforeServerStart
  }

  await checkForModrinthMods(config.mods.modrinth)
    .then(pauseAndWait => pauseAndWaitBeforeServerStart = pauseAndWait)

  return pauseAndWaitBeforeServerStart
}

export async function checkForModrinthMods(mods: ModrinthProject["id"][]): Promise<boolean> {
  let pauseAndWait = false

  for (const resourceID of mods) {
    const resource = await getModrinthProjectCompatibleVersion(
      resourceID,
      [config.mod_loader],
      [config.minecraft_version]
    )

    if (!resource) {
      console.error(
        $t('errors.modloaders.modrinth.unable_to_find', { resourceID })
      )
      pauseAndWait = true
      break
    }

    const success = await downloadModrinthMod(resource)
    pauseAndWait = !success

  }

  return pauseAndWait
}

export async function downloadModrinthMod (resource: ModrinthProjectVersion): Promise<boolean> {
  if (!resource) {
    console.error(
      $t('errors.modloaders.modrinth.missing_resource')
    )
  }

  return await downloadModrinthProject(resource, 'mod')
}