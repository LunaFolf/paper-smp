import { get } from './http'
import { createWriteStream } from "fs"
import {writeToFile} from "../utils/filesystem"

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

export async function getBuilds (minecraftVersion: string, build?: number): Promise<PaperBuild[] | null> {
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

export async function downloadBuildJar (minecraftVersion: string, build: number, fileName: string = `paper-${minecraftVersion}-${build}.jar`) {
  try {
    const response = await get(`https://papermc.io/api/v2/projects/paper/versions/${minecraftVersion}/builds/${build}/downloads/${fileName}`);
    if (!response || !response.body) {
      console.error(response)
      throw new Error('Something aint right, chief')
    }
    const reader = response.body.getReader();
    const stream = createWriteStream(`./bin/papermc/${fileName}`);

    await writeToFile(reader, stream);

  } catch (error) {
    console.error('An error occurred: ', error);
  }
  return null;
}