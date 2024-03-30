import {downloadSpigotResource, getSpigotResource} from "../api/spigot";
import {downloadModrinthProject, getModrinthProjectCompatibleVersion} from "../api/modrinth";
import {downloadEssentialsXAsset, getReleases} from "../api/essentialsx";
import fs from "fs";
import {getConfig, getGameMainVersion} from "./config";
import {checkForLatestGeyser} from "../setup/03_geyser";
import {downloadFloodgate, downloadGeyser} from "../api/geyser";

const config = getConfig()

const serverPluginsPath = "./server/plugins";
const binPluginsPath = "./bin/plugins";
const manualPluginsPath = "./manual_plugins";

type downloadPluginResult = {
  success: boolean,
  manualDownloadRequired: boolean
}

// TODO: name this something better
type allPluginsResult = {
  pauseAndWait: boolean, // Pause the launch of the server, and wait for the user to confirm start
}

/**
 * Download a spigot plugin, using the given SpigotResource.
 * @param resource
 */

export async function downloadSpigotPlugin (resource: SpigotResource): Promise<downloadPluginResult> {
  if (!resource) {
    console.error('Missing Resource! Can\'t download nothing!')
    throw Error('Missing Resource! Can\'t download nothing!')
  }

  if (resource.external) {
    const url = new URL(resource.file.externalUrl)
    const hostSplit = url.host.split('.')
    const site = hostSplit[hostSplit.length - 2].toLowerCase()

    switch (site) {
      case "patreon":
        console.error('Manual download of ' + resource.id +' required, you can download from the URL here:', resource.file.externalUrl)
        console.error('[We\'ll pause the server launch for you so you have time to download it, to opt out of this use --no-pause]')

        return { success: false, manualDownloadRequired: true }
      default:
        console.error('Unknown external source', site)
        return { success: false, manualDownloadRequired: true }
    }
  }

  const success = await downloadSpigotResource(resource)

  return { success, manualDownloadRequired: !success }
}

/**
 * Download Modrinth plugin using given ModrinthProjectVersion resource.
 * @param resource
 */

export async function downloadModrinthPlugin (resource: ModrinthProjectVersion): Promise<downloadPluginResult> {
  if (!resource) {
    console.error('Missing Resource! Can\'t download nothing!')
    throw Error('Missing Resource! Can\'t download nothing!')
  }

  const success = await downloadModrinthProject(resource)

  return { success, manualDownloadRequired: !success }
}

/**
 * check the server config for spigot plugins.
 * For each plugin that is there, get the resource and attempt to download it.
 */

export async function checkForSpigotPlugins (plugins: serverConfig['plugins']['spigot']): Promise<allPluginsResult> {
  let pauseAndWait = false

  for (const resourceID of plugins) {
    const resource = await getSpigotResource(resourceID)

    if (!resource) {
      console.error('Missing Resource! Unable to find ' + resourceID + ' on Spigot!')
      pauseAndWait = true
      break
    }

    const download = await downloadSpigotPlugin(resource)
    if (!download.success || download.manualDownloadRequired) {
      pauseAndWait = true
    }
  }

  return { pauseAndWait }
}

/**
 * check the server config for Modrinth plugins.
 * For each plugin that is there, get the resource and attempt to download it.
 */

export async function checkForModrinthPlugins (plugins: serverConfig['plugins']['modrinth']): Promise<allPluginsResult> {
  let pauseAndWait = false

  for (const resourceID of plugins) {
    const resource = await getModrinthProjectCompatibleVersion(resourceID, ['bukkit'], [
      config.minecraft_version,
      getGameMainVersion()
    ])

    if (!resource) {
      console.error('Missing Resource! Unable to find ' + resourceID + ' on Modrinth!')
      pauseAndWait = true
      break
    }

    const download = await downloadModrinthPlugin(resource)
    if (!download.success || download.manualDownloadRequired) {
      pauseAndWait = true
    }
  }

  return { pauseAndWait }
}

/**
 * Checks for the latest release of essential plugins.
 *
 * @returns {Promise<EssentialsXBuild>} A promise that resolves to the latest release of essential plugins.
 * @throws {Error} If no releases are available or if no latest release is available.
 */

export async function checkForLatestEssentialPlugins (): Promise<EssentialsXBuild> {
  const releases = await getReleases()

  if (!releases) throw new Error(`No releases available`)

  const latestRelease = releases[0]
  if (!latestRelease) throw new Error(`No latest release available`)

  return latestRelease
}

/**
 * Clears the cache of plugins by removing all files in the './bin/plugins' directory.
 * @returns {Promise<void>} A promise that resolves when the cache is cleared successfully.
 */

export async function clearCachedPlugins (): Promise<void> {
  fs.readdir('./bin/plugins', (err, files) => {
    for (const file of files) {
      fs.rmSync(`./bin/plugins/` + file)
    }
  })
}

export async function downloadPlugins(): Promise<boolean> {
  let pauseAndWaitBeforeServerStart = false

  await clearCachedPlugins()

  /**
   * Download EssentialsX and EssentialsX Assets
   */
    const essentialsBuild = await checkForLatestEssentialPlugins()
    for (const essentialsAsset of essentialsBuild.assets) {
      const isEssentialsAssetEnabled = config.plugins.essentials_x.some(enabledAsset => essentialsAsset.name.startsWith(enabledAsset + '-'))

      if (isEssentialsAssetEnabled) {
        console.log('Downloading essentials asset: ', essentialsAsset.name)
        await downloadEssentialsXAsset(essentialsBuild.tag_name, essentialsAsset.name)
      }
    }

  /**
   * Download Geyser and Floodgate
   */
  const { latestGeyser, latestFloodgate } = await checkForLatestGeyser()

  console.log('Downloading Geyser', latestGeyser.version, latestGeyser.build)
  await downloadGeyser(latestGeyser.version, latestGeyser.build)

  console.log('Downloading Floodgate', latestFloodgate.version, latestFloodgate.build)
  await downloadFloodgate(latestFloodgate.version, latestFloodgate.build)

  /**
   * Download Spigot Plugins
   */
  await checkForSpigotPlugins(config.plugins.spigot)
    .then(({ pauseAndWait }) => pauseAndWaitBeforeServerStart = pauseAndWait)

  /**
   * Download Modrinth Plugins
   */
  await checkForModrinthPlugins(config.plugins.modrinth)
    .then(({ pauseAndWait }) => pauseAndWaitBeforeServerStart = pauseAndWait)

  /**
   * Remove existing server plugins, copy new ones and also copy manual ones.
   */
  const existingPluginFiles = fs.readdirSync(serverPluginsPath).filter(file => file.endsWith('.jar'))
  for (const file of existingPluginFiles) {
    console.log('Removing Server Plugin Jar', file)
    fs.rmSync(`${serverPluginsPath}/${file}`)
  }

  const newPluginFiles = fs.readdirSync(binPluginsPath);
  for (const file of newPluginFiles) {
    console.log('Copying to server plugins', file);
    try {
      fs.copyFileSync(`${binPluginsPath}/${file}`, `${serverPluginsPath}/${file}`);
    } catch (error) {
      console.error('Error copying plugin Jar', error);
    }
  }
  const manualPluginFiles = fs.readdirSync(manualPluginsPath)
  for (const file of manualPluginFiles) {
    console.log('Copying to server manual plugins', file)
    fs.copyFileSync(`${manualPluginsPath}/${file}`, `${serverPluginsPath}/${file}`, fs.constants.COPYFILE_EXCL)
  }

  return pauseAndWaitBeforeServerStart
}