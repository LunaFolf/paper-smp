import fs from "fs";
import crypto from "crypto";
import {getConfig} from "../utils/config";
import {setupPaperServerJar} from "../loaders/paper";
import {setupFabricServerJar} from "../loaders/fabric";

const config = getConfig()

export function checkBinForServerJar (jarFileName: string, checksum?: string) {
  const filePath = `./bin/loaders/${jarFileName}`
  const binHasFile = fs.existsSync(filePath)

  if (!binHasFile) return false

  if (checksum) {
    const hash = crypto.createHash('sha256')
      .update(fs.readFileSync(filePath))
      .digest('hex')

    if (hash !== checksum) return false
  }

  return true
}

export async function setupServerJar (): Promise<void> {
  const loader = config.mod_loader

  let javaPath = ''

  switch(loader) {
    case "paper":
      await setupPaperServerJar()
      break
    case "fabric":
      await setupFabricServerJar()
      break
    default:
      console.error(`'${loader}' is not currently supported for mod_loader option`)
      process.exit(1)
  }
}