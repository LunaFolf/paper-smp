import {get} from "./http";
import {createWriteStream} from "fs";
import {writeToFile} from "../utils/filesystem";
import {__error, __log} from "../utils/logging";

export async function getAssets (arch: adoptArch, os: adoptOS, image: adoptImage = 'jre'): Promise<adoptBinaryAssetView | null> {
  const url = 'https://api.adoptium.net/v3/assets/latest/21/hotspot'
  const params = {
    architecture: arch,
    os,
    image_type: image
  }

  const response = await get(url, params)
  if (!response) return null

  const jsonResponse = await response.json()

  return jsonResponse[0] as adoptBinaryAssetView
}

export async function downloadJRE (downloadURL: string, packageName: string) {
  try {
    __log('Downloading', packageName)
    const response = await get(downloadURL)
    if (!response || !response.body) {
      __error(response)
      throw new Error('Something aint right, chief')
    }
    const reader = response.body.getReader();

    const stream = createWriteStream(`./bin/openjre/${packageName}`);

    await writeToFile(reader, stream);

  } catch (error) {
    __error('An error occurred: ', error);
  }
}