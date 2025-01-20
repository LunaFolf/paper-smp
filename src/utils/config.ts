import yaml from "yaml";
import fs from "fs";
import path from "node:path";
import {$t} from "./translations";
import {addWSSEventListener, broadcast, getServerState} from "../web_render";
import {__log} from "./logging";

const defaultConfigPath = path.resolve(__dirname, '../setup/defaultServerConfig.yml');
const actualConfigPath = path.join(process.cwd(), 'server-config.yml')
const serverPropertiesPath = path.join(process.cwd(), 'server/server.properties')

/**
 * Check if the server-config.yml exists
 * If it does not, create it using our default
 */

function checkIfConfigExists() {
  // Check if the server-config file exists
  if (!fs.existsSync(actualConfigPath)) {
    process.nextTick(() => {
      __log(
        $t('info.auto_creating_config')
      )
    })
    // If the server-config file does not exist, read the default config
    const defaultConfig = fs.readFileSync(defaultConfigPath, 'utf8');

    // Then create a new server-config file with the default config content
    fs.writeFileSync(actualConfigPath, defaultConfig, 'utf8');
  }
}

function mapConfigToProperties(config: serverConfig) {
  let outcome = ''

  Object.keys(config.game_settings).forEach((propertyKey: string) => {
    const value = config.game_settings[propertyKey as keyof MinecraftSettings] || '';

    let valueFormatted = value
    if (typeof valueFormatted !== 'string') valueFormatted = JSON.stringify(value)

    outcome += propertyKey.replace(/_/gmi, '-') + '=' + valueFormatted + '\n';
  })

  return outcome
}

let hasConfigChanged: boolean = false
let config: serverConfig

if (addWSSEventListener) {
  addWSSEventListener('onMessage', ({ data, ws }) => {
    if (!data || !ws) return

    if (data.type === 'requestConfig') {
      ws.send(JSON.stringify({
        type: 'serverConfig',
        data: config
      }))
    }

    if (data.type === 'saveConfig') {
      saveConfig(data.content)
    }
  })
}

export function setHasConfigChanged(state: boolean): void {
  hasConfigChanged = state
  broadcast('hasConfigChanged', state);
}

export function getHasConfigChanged(): boolean {
  return hasConfigChanged
}

export function saveConfig(newConfig: serverConfig) {
  config = newConfig

  fs.writeFileSync(actualConfigPath, yaml.stringify(newConfig), 'utf8');

  if (['online', 'booting'].includes(getServerState())) {
    setHasConfigChanged(true)
  }

  fs.writeFileSync(serverPropertiesPath, mapConfigToProperties(newConfig))
}

export function getConfig() {
  if (!config) {
    checkIfConfigExists();
    config = yaml.parse(fs.readFileSync(actualConfigPath).toString())
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