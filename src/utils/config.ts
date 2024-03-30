import yaml from "yaml";
import fs from "fs";

let config: serverConfig

export function getConfig() {
  console.debug('getting config')
  if (!config) {
    console.debug('no config saved, getting new')
    config = yaml.parse(fs.readFileSync('./server-config.yml').toString())
  }

  return config
}

export function getGameMainVersion() {
  const gameVersionSplit = config.minecraft_version.split('.')

  if (gameVersionSplit && gameVersionSplit.length > 2) {
    gameVersionSplit.pop()
    return gameVersionSplit.join('.')
  }

  return config.minecraft_version
}