import {get} from './http'
import {createWriteStream} from "fs"
import {writeToFile} from "../utils/filesystem"

type EssentialsXAsset = {
  id: number,
  name: string,
  browser_download_url: string
}

type EssentialsXBuild = {
  id: number,
  tag_name: string,
  draft: Boolean,
  prerelease: Boolean,
  assets: EssentialsXAsset[]
}

export async function getReleases (): Promise<EssentialsXBuild[] | null> {
  const response = await get('https://api.github.com/repos/EssentialsX/Essentials/releases')
  if (!response) return null

  return await response.json()
}

export async function downloadAssetJar (tagName: string, assetName: string) {
  try {
    const response = await get(`https://github.com/EssentialsX/Essentials/releases/download/${tagName}/${assetName}`);
    if (!response || !response.body) {
      console.error(response)
      throw new Error('Something aint right, chief')
    }
    const reader = response.body.getReader();

    const newFileName = assetName.split('-')[0] + '.jar'

    const stream = createWriteStream(`./bin/plugins/${newFileName}`);

    await writeToFile(reader, stream);

  } catch (error) {
    console.error('An error occurred: ', error);
  }
  return null;
}