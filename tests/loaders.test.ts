import {removeServerDir} from "./testutils";
import {setupPaperServerJar} from "../src/loaders/paper";
import * as fs from "fs";
import {setupFabricServerJar} from "../src/loaders/fabric";
import {checkRequiredPaths} from "../src/setup/00_initialisation";

describe('Test available loaders', () => {

  test('Download and copy Paper', async () => {
    removeServerDir();
    checkRequiredPaths();

    await setupPaperServerJar();
    const serverJarExists = fs.existsSync('./server/server.jar');

    expect(serverJarExists).toBe(true);
  })

  test('Download and copy Fabric', async () => {
    removeServerDir();
    checkRequiredPaths();

    await setupFabricServerJar();
    const serverJarExists = fs.existsSync('./server/server.jar');

    expect(serverJarExists).toBe(true);
  })

})