import {get} from './http'
import {createWriteStream} from "fs"
import {writeToFile} from "../utils/filesystem"
import {__error, __log} from "../utils/logging";

export async function getSpigotResource (resourceID: number): Promise<SpigotResource | null> {
  const response = await get('https://api.spiget.org/v2/resources/' + resourceID)
  if (!response) return null

  return await response.json()
}

export async function downloadSpigotResource (resource: SpigotResource): Promise<boolean> {
  try {
    const fileName = resource.file.url.split('/')[1].split('.')[0] +'.jar'
    __log('Downloading', resource.id, `(${fileName})`)

    const response = await get('https://api.spiget.org/v2/resources/' + resource.id + '/download');
    if (!response || !response.body) {
      __error(response)
      throw new Error('Something aint right, chief')
    }
    const reader = response.body.getReader();
    const stream = createWriteStream(`./bin/plugins/${fileName}`);

    await writeToFile(reader, stream);

    return true

  } catch (error) {
    __error('An error occurred: ', error);

    return false
  }
}