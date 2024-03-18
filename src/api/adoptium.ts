import {get} from "./http";
import {createWriteStream} from "fs";
import {writeToFile} from "../utils/filesystem";

export type adoptArch = 'x64' | 'x86' | 'x32' | 'ppc64' | 'ppc64le' | 's390x' | 'aarch64' | 'arm' | 'sparcv9' | 'riscv64'
export type adoptOS = 'linux' | 'windows' | 'mac' | 'solaris' | 'aix' | 'alpine-linux'
export type adoptImage = 'jdk' | 'jre' | 'testimage' | 'debugimage' | 'staticlibs' | 'sources' | 'sbom'

type adoptBinaryAssetView = {
  release_name: string,
  release_link: string,
  binary: {
    os: adoptOS,
    architecture: adoptArch,
    image_type: adoptImage,
    package: {
      name: string,
      link: string,
      checksum: string | null
    }
  },
  version: {
    semver: string
  }
}

export async function getAssets (arch: adoptArch, os: adoptOS, image: adoptImage = 'jre'): Promise<adoptBinaryAssetView | null> {
  const url = `https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=${arch}&os=${os}&image_type=${image}`

  const response = await get(url)
  if (!response) return null

  const jsonResponse = await response.json()

  return jsonResponse[0] as adoptBinaryAssetView
}

export async function downloadJRE (downloadURL: string, packageName: string) {
  try {
    console.log('Downloading', packageName)
    const response = await get(downloadURL)
    if (!response || !response.body) {
      console.error(response)
      throw new Error('Something aint right, chief')
    }
    const reader = response.body.getReader();

    const stream = createWriteStream(`./bin/openjre/${packageName}`);

    await writeToFile(reader, stream);

    console.log('Done')

  } catch (error) {
    console.error('An error occurred: ', error);
  }
}