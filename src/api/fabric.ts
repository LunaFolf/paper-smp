import {get} from "./http";
import {create} from "node:domain";
import {createWriteStream} from "fs";
import {writeToFile} from "../utils/filesystem";

type FabricLoaderVersion = {
  loader: {
    separator: string,
    build: number,
    maven: string,
    version: string,
    stable: boolean
  }
}

type FabricInstaller = {
  url: string,
  maven: string,
  version: string,
  stable: boolean
}

export async function getFabricLoaders (minecraftVersion: string): Promise<FabricLoaderVersion[] | null> {
  const response = await get('https://meta.fabricmc.net/v2/versions/loader/' + minecraftVersion);
  if (!response) return null

  const data: FabricLoaderVersion[] = await response.json();

  if (!data.length) return null

  return data
}

export async function getFabricInstallers (): Promise<FabricInstaller[] | null> {
  const response = await get('https://meta.fabricmc.net/v2/versions/installer')
  if (!response) return null

  const data: FabricInstaller[] = await response.json();

  if (!data.length) return null

  return data
}

export async function downloadFabricServerJar (
  minecraftVersion: string,
  loaderVersion: string,
  installerVersion: string,
  fileName: string = `fabric-${minecraftVersion}-${loaderVersion}-${installerVersion}.jar`
): Promise<boolean> {
  try {
    const response = await get(
      `https://meta.fabricmc.net/v2/versions/loader/${minecraftVersion}/${loaderVersion}/${installerVersion}/server/jar`
    )
    if (!response || !response.body) {
      console.error(response)
      return false
    }

    const reader = response.body.getReader();
    const stream = createWriteStream(`./bin/loaders/${fileName}`)

    await writeToFile(reader, stream);

    return true
  } catch (error) {
    console.error('An error occurred: ', error);
    return false
  }
}