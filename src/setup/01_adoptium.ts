import fs from "fs";
import {downloadJRE, getAssets} from "../api/adoptium";
import decompress from "decompress";

export async function checkForOpenJRE(): Promise<string | void> {
  const _arch = process.arch
  const _platform = process.platform

  let arch: adoptArch
  let platform: adoptOS

  switch (_arch) {
    case "arm64":
    case "ia32":
    case "mips":
    case "mipsel":
    case "ppc":
    case "s390":
      console.error(_arch, 'architecture is not supported by AdoptOpenJDK')
      return
    default:
      arch = _arch
      break
  }

  switch (_platform) {
    case "win32":
      platform = "windows"
      break
    case "android":
    case "darwin":
    case "freebsd":
    case "haiku":
    case "openbsd":
    case "sunos":
    case "cygwin":
    case "netbsd":
      console.error(_platform, 'platform is not supported by AdoptOpenJDK')
      return
    default:
      platform = _platform
      break
  }

  const jreAsset = await getAssets(arch, platform)

  if (!jreAsset) {
    console.error('Unable to find available JRE for', platform, arch)
    return
  }

  const jrePath = jreAsset.release_name + '-jre'

  if (!fs.existsSync('./bin/openjre/' + jrePath)) {
    const packagePath = './bin/openjre/' + jreAsset.binary.package.name
    await downloadJRE(jreAsset.binary.package.link, jreAsset.binary.package.name)
    await decompress('./bin/openjre/' + jreAsset.binary.package.name, './bin/openjre/')
    fs.rmSync(packagePath)
  }

  return jrePath

}