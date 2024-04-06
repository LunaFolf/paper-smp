import http from 'node:http';
import * as ws from 'ws'
import path from 'node:path';
import fs from 'fs';
import {getConfig, getHasConfigChanged} from "./utils/config";
import {__error} from "./utils/logging";

const authedUsers: AuthRecord[] = []

interface HistoryItem {
  content: string,
  timestamp: number,
  type: string
}

type eventType = 'onMessage' | 'onError' | 'onConnection'
type ServerState = 'offline' | 'restarting' | 'booting' | 'online' | 'updating' | 'shutdown'

type callbackReturn = {
  wss: ws.Server,
  ws?: ws.WebSocket,
  data?: any,
  err?: Error
}

type eventCallbackFn = (data: callbackReturn) => void

const eventListeners: { eventType: eventType, callbackFn: eventCallbackFn }[] = []
let serverState: ServerState = 'offline'
let history: HistoryItem[] = []

export function updateAuthUserClient(token: string, client: ws.WebSocket) {
  const record = authedUsers.find(r => r.auth_token === token)
  if (!record) return

  record.ws_client = client
}

export function isTokenAllowed(auth_token: string): boolean {
  return authedUsers.some(record => {
    return record.auth_token === auth_token && new Date().getTime() <= record.expiry;
  })
}

export function getAuthedUsers(): AuthRecord[] {
  return authedUsers
}

export function addAuthUser(authRecord: AuthRecord): void {
  authedUsers.push(authRecord)
}

export function setServerState(state: ServerState) {
  serverState = state
  broadcastEverything()
}

export function getServerState(): ServerState {
  return serverState
}

export function clearHistory() {
  history = [];
  broadcastEverything()
}

export function broadcastEverything() {
  broadcast('updateHistory', history.slice(-100))
  broadcast('serverState', serverState)
  broadcast('hasConfigChanged', getHasConfigChanged())
  broadcast('serverConfig', getConfig())
}

export function sendToClient(client: ws.WebSocket, type: string, data: any) {
  client.send(JSON.stringify({ type, data }))
}

addWSSEventListener('onMessage', (callback) => {
  if (callback.ws && callback.data) {
    const { type } = callback.data

    if (type === 'requestEverything') {
      sendToClient(callback.ws, 'updateHistory', history.slice(-100))
      sendToClient(callback.ws, 'serverState', serverState)
      sendToClient(callback.ws, 'hasConfigChanged', getHasConfigChanged())
      sendToClient(callback.ws, 'serverConfig', getConfig())
    }
  }
})

export function broadcast(type: string, data: any) {
  getAuthedUsers().forEach(authRecord => {
    authRecord.ws_client.send(JSON.stringify({ type, data }))
  })
}

export function addToHistory(data: HistoryItem) {
  history.push(data)

  broadcastEverything()
}

export function addWSSEventListener(eventType: eventType, callbackFn: eventCallbackFn): void {
  eventListeners.push({ eventType, callbackFn });
}

function openRoute(fullPath: string, res: http.ServerResponse<http.IncomingMessage>) {
  // __debug('Attempting to open route', fullPath)
  fs.stat(fullPath, (err, stat) => {
    if (err) {
      if (fullPath.endsWith('web/index.html') || fullPath.endsWith('web\\index.html')) {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('404 Not Found');
        return
      }
      // __debug('Redirecting to main index')
      // If the file doesn't exist or there is an error accessing it, send a 404 response
      openRoute(path.join(process.cwd(), 'bin/web/index.html'), res)
      return;
    }

    if (stat.isFile()) {
      // __debug('File Found')
      // If the file exists, read it from the file system
      fs.readFile(fullPath, (err, data) => {
        if (err) {
          // __debug('Error with file', err)
          // If there is an error reading the file, send a 500 response
          res.writeHead(500, {'Content-Type': 'text/plain'});
          res.end('Internal Server Error');
          return;
        }

        // Determine the content type based on the file extension
        const ext = path.extname(fullPath);
        let contentType = 'text/html'; // Default content type
        switch (ext) {
          case '.zip':
            contentType = 'application/zip';
            break;
          case '.css':
            contentType = 'text/css';
            break;
          case '.js':
            contentType = 'text/javascript';
            break;
          case '.png':
            contentType = 'image/png';
            break;
          case '.svg':
            contentType = 'image/svg+xml';
            break;
          case '.jpg':
            contentType = 'image/jpeg';
            break;
          // Add more cases for other file types as needed
        }

        // __debug('Opening', fullPath, 'as', contentType)

        // Send the file contents in the response
        res.writeHead(200, {'Content-Type': contentType});
        res.end(data, 'utf-8');
      });
    } else {
      // __debug('Path exists, but not file. returning 404')
      // If the path exists, but it's not a file (e.g., it's a directory), send a 404 response
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('404 Not Found');
    }
  });
}

const httpServer = http.createServer((req, res) => {
  // __debug('Incoming request', req.url)
  // Parse the URL to get the file path
  const filePath = req.url === '/' ? '/index.html' : req.url;

  // __debug('filePath:', filePath)

  if (!filePath) return res.end()

  if (req.url === '/downloadMods') return openRoute(path.join(process.cwd(), 'modExport.zip'), res)

  // Construct the absolute path to the file
  const fullPath = path.join(process.cwd(), 'bin/web', filePath);

  // __debug('fullPath:', fullPath)

  // Check if the file exists using fs.stat
  openRoute(fullPath, res)


})

const wss = new ws.Server({
  server: httpServer
});

wss.on('connection', (ws: ws.WebSocket) => {
  broadcastEverything()

  eventListeners.filter(event => event.eventType === 'onConnection').forEach(event => {
    event.callbackFn({ wss, ws });
  })

  ws.on('message', (msg: ws.RawData) => {
    const data = JSON.parse(msg.toString())

    if (data.type !== 'discordAuth') {
      if (!data.token) return
      const isTokenValid = isTokenAllowed(data.token)

      if (!isTokenValid) {
        ws.send(JSON.stringify({
          type: 'deAuth'
        }))
        return
      }

      updateAuthUserClient(data.token, ws)
    }

    eventListeners.filter(event => event.eventType === 'onMessage').forEach(event => {
      event.callbackFn({ wss, ws, data });
    })
  })
});

wss.on('error', (err) => {
  __error(err);

  eventListeners.filter(event => event.eventType === 'onError').forEach(event => {
    event.callbackFn({ wss, err });
  })
});

export function startHTTPServer(webPort = 4321) {
  httpServer.listen(webPort);
}