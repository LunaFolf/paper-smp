const dotenv = require('dotenv').config()

if (dotenv.error) {
  throw dotenv.error;
}

require('colors')

import "./utils/config";
import "./utils/logging";
import "./utils/discord";
import './web_render';

import {setupServer} from "./setup/00_initialisation";
import {writeFileSync} from 'fs'
import {downloadPlugins} from "./utils/plugins";
import {downloadMods} from "./utils/mods";
import {startServer} from "./utils/process";

import {addWSSEventListener, setServerState, startHTTPServer} from "./web_render";
import {getConfig} from "./utils/config";

addWSSEventListener('onMessage', ({ data, ws }) => {
  if (!data) return

  if (data.type === 'action' && data.content === 'start') {
    main(true)
  }
})

const webPort = getConfig().launcher_settings.web_port || 4321

startHTTPServer(webPort)

export function main(startNow = false) {
  setServerState('updating')

  setupServer()
    .then(async javaPath => {
      await downloadPlugins()
      await downloadMods()

      writeFileSync('./server/eula.txt','#suck it\n#microsoft\neula=true') // Is this legal??

      await startServer(javaPath, startNow)
    })
}

main()