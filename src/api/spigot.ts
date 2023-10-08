import {get} from './http'
import {createWriteStream} from "fs"
import {writeToFile} from "../utils/filesystem"

type SpigotResource = {
  id: number,
  external: boolean,
  file: {
    type: string,
    size: number,
    sizeUnit: string,
    url: string,
    externalUrl: string
  },
  description: string, // base64 encoded HTML
  testedVersions: string[]
}

export async function getResource (resourceID: number): Promise<SpigotResource | null> {
  const response = await get('https://api.spiget.org/v2/resources/' + resourceID)
  if (!response) return null

  return await response.json()
}

export async function downloadResource (resourceID: number, fileName: string) {
  try {
    console.log('Downloading', resourceID, `(${fileName})`)
    const response = await get('https://api.spiget.org/v2/resources/' + resourceID + '/download');
    if (!response || !response.body) {
      console.error(response)
      throw new Error('Something aint right, chief')
    }
    const reader = response.body.getReader();

    const stream = createWriteStream(`./bin/plugins/${fileName}`);

    await writeToFile(reader, stream);

    console.log('Done')

  } catch (error) {
    console.error('An error occurred: ', error);
  }
}