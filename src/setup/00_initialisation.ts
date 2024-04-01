import fs from 'fs';
import path from 'path';
import {setupServerJar} from "./02_mcloader";
import {checkForOpenJRE} from "./01_adoptium";

/**
 * Check if the server-config.yml exists
 * If it does not, create it using our default
 */

// Define the paths
const defaultPath = path.resolve(__dirname, '../setup/defaultServerConfig.yml');

// Check if the server-config file exists
if (!fs.existsSync('./server-config.yml')) {
  // If the server-config file does not exist, read the default config
  const defaultConfig = fs.readFileSync(defaultPath, 'utf8');

  // Then create a new server-config file with the default config content
  fs.writeFileSync('./server-config.yml', defaultConfig, 'utf8');
}

/**
 * Create a list of all the required directories,
 * then break down the paths and check every directory exists
 * If it does not, create it.
 */

const requiredPaths = [
  './bin/openjre',
  './bin/loaders',

  './bin/plugins',
  './bin/mods',

  './manual_plugins',
  './manual_mods',

  './server/plugins',
  './server/mods'
]

requiredPaths.forEach(requiredPath => {
  const directories = requiredPath.split('/').reverse()

  let currentPath = ''
  while (directories.length > 0) {
    currentPath = path.join(currentPath, directories.pop()!);
    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath);
    }
  }
})

/**
 * Sets up the Minecraft server by installing the necessary server jar and verifying the availability of the Java Runtime Environment (JRE).
 *
 * @throws {Error} - Throws an error if the Java executable cannot be found.
 * @returns {Promise<string>} - A promise that resolves once the setup is complete, or rejects if an error occurs.
 */

export async function setupServer(): Promise<string> {
  // Setup the minecraft server jar
  await setupServerJar()

  const javaPath = await checkForOpenJRE()
  if (!javaPath) throw new Error('Unable to find java exec, wah wah')

  return javaPath
}