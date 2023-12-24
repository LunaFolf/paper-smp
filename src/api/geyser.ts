import {get} from './http'
import {createWriteStream} from "fs"
import {writeToFile} from "../utils/filesystem"

type GeyserDownloadType = 'bungeecord' | 'fabric' | 'spigot' | 'standalone' | 'velocity'
type FloodgateDownloadType = 'bungee' | 'spigot' | 'velocity'

type GeyserBuild = {
  build: number,
  version: string,
  downloads: {
    [key in GeyserDownloadType]: {
      name: string,
      sha256: string
    }
  }
}

type FloodgateBuild = {
  build: number,
  version: string,
  downloads: {
    [key in FloodgateDownloadType]: {
      name: string,
      sha256: string
    }
  }
}

export async function getLatestGeyser (): Promise<GeyserBuild | null> {
  const response = await get('https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest')
  if (!response) return null

  return await response.json()
}
export async function getLatestFloodgate (): Promise<FloodgateBuild | null> {
  const response = await get('https://download.geysermc.org/v2/projects/floodgate/versions/latest/builds/latest')
  if (!response) return null

  return await response.json()
}

export async function downloadGeyser (version: string, build: number, fileName: string = `Geyser-Spigot.jar`) {
  try {
    const response = await get(`https://download.geysermc.org/v2/projects/geyser/versions/${version}/builds/${build}/downloads/spigot`);
    if (!response || !response.body) {
      console.error(response)
      throw new Error('Something aint right, chief')
    }
    const reader = response.body.getReader();
    const stream = createWriteStream(`./bin/plugins/${fileName}`);

    await writeToFile(reader, stream);

  } catch (error) {
    console.error('An error occurred: ', error);
  }
}
export async function downloadFloodgate (version: string, build: number, fileName: string = `floodgate-spigot.jar`) {
  try {
    const response = await get(`https://download.geysermc.org/v2/projects/floodgate/versions/${version}/builds/${build}/downloads/spigot`);
    if (!response || !response.body) {
      console.error(response)
      throw new Error('Something aint right, chief')
    }
    const reader = response.body.getReader();
    const stream = createWriteStream(`./bin/plugins/${fileName}`);

    await writeToFile(reader, stream);

  } catch (error) {
    console.error('An error occurred: ', error);
  }
}