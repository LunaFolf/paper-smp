import {downloadSpigotResource} from "../api/spigot";
import {downloadModrinthProject} from "../api/modrinth";

type PluginHandleResult = {
  success: boolean,
  manualDownloadRequired: boolean
}

export async function handleSpigotPluginDownload (resource: SpigotResource): Promise<PluginHandleResult> {
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

export async function handleModrinthPluginDownload (resource: ModrinthProjectVersion): Promise<PluginHandleResult> {
  if (!resource) {
    console.error('Missing Resource! Can\'t download nothing!')
    throw Error('Missing Resource! Can\'t download nothing!')
  }

  const success = await downloadModrinthProject(resource)

  return { success, manualDownloadRequired: !success }
}