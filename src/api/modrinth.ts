import {get} from "./http";
import {createWriteStream} from "fs";
import {writeToFile} from "../utils/filesystem";

export async function getModrinthProjectCompatibleVersion (
  projectID: string,
  loaders?: ModrinthProjectVersion["loaders"],
  game_versions?: ModrinthProjectVersion["game_versions"],
): Promise<ModrinthProjectVersion | null> {
  // console.debug({
  //   projectID,
  //   loaders,
  //   game_versions
  // })
  try {
    const response = await get(`https://api.modrinth.com/v2/project/${projectID}/version`, {
      loaders: JSON.stringify(loaders || []),
      game_versions: JSON.stringify(game_versions || []),
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

export async function downloadModrinthProject (resource: ModrinthProjectVersion, type: ModrinthPluginType): Promise<boolean> {
  try {
    const firstFile = resource.files[0]

    if (!firstFile) {
      console.error('No files available! can\'t download nothing!')
      return false
    }

    const response = await get(firstFile.url)
    if (!response || !response.body) {
      console.error(response)
      return false
    }

    const reader = response.body.getReader();
    const stream = createWriteStream(`./bin/${type}s/${firstFile.filename}`);

    await writeToFile(reader, stream);

    console.log('Done')

    return true
  } catch (error) {
    console.error('An error occurred: ', error);

    return false
  }
}