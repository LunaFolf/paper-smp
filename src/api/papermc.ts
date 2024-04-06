import { get } from './http'
import { createWriteStream } from "fs"
import {writeToFile} from "../utils/filesystem"
import {__error} from "../utils/logging";

type PaperBuildsResponse = {
  project_id: 'paper',
  project_name: 'Paper',
  version: string,
  builds: PaperBuild[]
}

type PaperBuild = {
  build: number,
  time: string,
  channel: string,
  promoted: false,
  changes: object[],
  downloads: {
    application: {
      name: string,
      sha256: string
    },
    'mojang-mappings': {
      name: string,
      sha256: string
    }
  }
}

export async function getPaperBuilds (minecraftVersion: string, build?: number): Promise<PaperBuild[] | null> {
  if (build) {
    const response = await get(`https://papermc.io/api/v2/projects/paper/versions/${minecraftVersion}/builds/${build}`)
    if (!response) return null

    const data: PaperBuild = await response.json()

    return [data]
  }

  const response = await get(`https://papermc.io/api/v2/projects/paper/versions/${minecraftVersion}/builds`)
  if (!response) return null

  const data: PaperBuildsResponse = await response.json()

  return data.builds
}

export async function downloadPaperBuildJar (
  minecraftVersion: string,
  build: number,
  fileName: string = `paper-${minecraftVersion}-${build}.jar`
): Promise<boolean> {
  try {
    const response = await get(
      `https://papermc.io/api/v2/projects/paper/versions/${minecraftVersion}/builds/${build}/downloads/${fileName}`
    );
    if (!response || !response.body) {
      __error(response)
      return false;
    }
    const reader = response.body.getReader();
    const stream = createWriteStream(`./bin/loaders/${fileName}`);

    await writeToFile(reader, stream);

    return true

  } catch (error) {
    __error('An error occurred: ', error);
    return false;
  }
}