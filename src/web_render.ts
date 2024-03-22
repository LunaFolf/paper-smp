import http from 'node:http';
import * as ws from 'ws'
import path from 'node:path';
import fs from 'fs';

type HistoryItem = {
  content: string,
  timestamp: number,
  type: string
}

type eventType = 'onMessage' | 'onError' | 'onConnection'

const history: HistoryItem[] = []

const eventListeners: { eventType: eventType, callbackFn: Function }[] = []

export function broadcast(type: string, data: string) {
  wss.clients.forEach(client => {
    client.send(JSON.stringify({ type, data }));
  })
}

export function addToHistory(data: HistoryItem) {
  history.push(data)

  broadcast('updateHistory', JSON.stringify(history))
}

export function addWSSEventListener(eventType: eventType, callbackFn: Function): void {
  eventListeners.push({ eventType, callbackFn });
}

function openRoute(fullPath: string, res: http.ServerResponse<http.IncomingMessage>) {
  fs.stat(fullPath, (err, stat) => {
    if (err) {
      // If the file doesn't exist or there is an error accessing it, send a 404 response
      openRoute(path.join(__dirname, 'web/dist/index.html'), res)
      return;
    }

    if (stat.isFile()) {
      // If the file exists, read it from the file system
      fs.readFile(fullPath, (err, data) => {
        if (err) {
          // If there is an error reading the file, send a 500 response
          res.writeHead(500, {'Content-Type': 'text/plain'});
          res.end('Internal Server Error');
          return;
        }

        // Determine the content type based on the file extension
        const ext = path.extname(fullPath);
        let contentType = 'text/html'; // Default content type
        switch (ext) {
          case '.css':
            contentType = 'text/css';
            break;
          case '.js':
            contentType = 'text/javascript';
            break;
          case '.png':
            contentType = 'image/png';
            break;
          case '.jpg':
            contentType = 'image/jpeg';
            break;
          // Add more cases for other file types as needed
        }

        // Send the file contents in the response
        res.writeHead(200, {'Content-Type': contentType});
        res.end(data, 'utf-8');
      });
    } else {
      // If the path exists but it's not a file (e.g., it's a directory), send a 404 response
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('404 Not Found');
    }
  });
}

const httpServer = http.createServer((req, res) => {
  // Parse the URL to get the file path
  const filePath = req.url === '/' ? '/index.html' : req.url;

  if (!filePath) return res.end()

  // Construct the absolute path to the file
  const fullPath = path.join(process.cwd(), 'bin/web', filePath);

  // Check if the file exists using fs.stat
  openRoute(fullPath, res)


})

const wss = new ws.Server({
  server: httpServer
});

wss.on('connection', (ws) => {
  broadcast('history', JSON.stringify(history))

  eventListeners.filter(event => event.eventType === 'onConnection').forEach(event => {
    event.callbackFn({ wss, ws });
  })

  ws.on('message', (msg: ws.RawData) => {
    const data = JSON.parse(msg.toString())

    eventListeners.filter(event => event.eventType === 'onMessage').forEach(event => {
      event.callbackFn({ wss, ws, data });
    })
  })
});

wss.on('error', (err) => {
  console.error(err);

  eventListeners.filter(event => event.eventType === 'onError').forEach(event => {
    event.callbackFn({ wss, err });
  })
});

httpServer.listen(4321, () => {
  console.log('Server running at http://localhost:4321/');

  console.debug('Path is set to', path.join(process.cwd(), 'bin/web'));
  console.debug('For example:', path.join(process.cwd(), 'bin/web', 'index.html'));
});