require('dotenv').config()
require('colors')
import fs from 'fs'
import {waitForKey} from "./utils/input"
import {downloadPlugins} from "./utils/plugins";
import {setupServer} from "./setup/00_initialisation";
import {startServer} from "./utils/process";

setupServer()
  .then(async javaPath => {
    await downloadPlugins()

    const waitBeforeStart = await downloadPlugins()

    if (waitBeforeStart) {
      console.log('[PAUSED] press ENTER to continue...')
      await waitForKey()
    }

    fs.writeFileSync('./server/eula.txt','#suck it\n#microsoft\neula=true') // Is this legal??

    await startServer(javaPath)
  })