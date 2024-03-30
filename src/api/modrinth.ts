import {get} from "./http";
import {createWriteStream} from "fs";
import {writeToFile} from "../utils/filesystem";

export async function getModrinthProjectCompatibleVersion (
  projectID: string,
  loaders?: ModrinthProjectVersion["loaders"],
  game_versions?: ModrinthProjectVersion["game_versions"],
): Promise<ModrinthProjectVersion | null> {
  try {
    const response = await get(`https://api.modrinth.com/v2/project/${projectID}/version`, {
      loaders: loaders || [],
      game_versions: game_versions || [],
    })

    if (response) {
      const data = await response.json();

      if (data.error) {
        console.error('Error getting modrinth project', data)
        return null
      }

      return data[0]
    }

    return null
  } catch (error) {
    console.error(error)
    return null
  }
}

export async function downloadModrinthProject (resource: ModrinthProjectVersion): Promise<boolean> {
  try {
    const firstFile = resource.files[0]

    if (!firstFile) {
      console.error('No files available! can\'t download nothing!')
      return false
    }

    console.log("Downloading Modrinth plugin", firstFile.filename)

    const response = await get(firstFile.url)
    if (!response || !response.body) {
      console.error(response)
      throw new Error('Something aint right, chief')
    }

    const reader = response.body.getReader();
    const stream = createWriteStream(`./bin/plugins/${firstFile.filename}`);

    await writeToFile(reader, stream);

    console.log('Done')

    return true
  } catch (error) {
    console.error('An error occurred: ', error);

    return false
  }
}