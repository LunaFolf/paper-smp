import fs from 'fs';
import path from 'path';
import {setupServerJar} from "./02_mcloader";
import {checkForOpenJRE} from "./01_adoptium";

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

export function checkRequiredPaths() {
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
}

checkRequiredPaths()

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