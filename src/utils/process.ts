// import {addToHistory, addWSSEventListener} from "./web_render";
import * as colours from 'colors'
import {textSync} from "figlet";
import {spawn, StdioOptions} from "child_process";

const timestampRegex = /^\[\d{2}:\d{2}:\d{2} \D{4}]/is // [00:00:00 INFO]
const titleRegex = /\[\D+?]/gi // [Essentials] [Vault] [Harbor] etc

const spawnArgs = [
  '-Xms5000M',
  '-Xmx5000M',
  '-jar',
  'paper.jar',
  'nogui'
]

const spawnOptions: { cwd: string, stdio: StdioOptions } = {
  cwd: './server',
  stdio: [
    'inherit',
    'pipe',
    'inherit'
  ]
}

export async function startServer (javaPath: string) {
  console.log(textSync('Starting Server', "Small Slant").rainbow)

  let javaExec = '../bin/openjre/' + javaPath + '/bin/java'
  switch (process.platform) {
    case "win32":
      javaExec = javaExec + '.exe'
      break
  }

  const child = spawn(javaExec, spawnArgs, spawnOptions)

  child.stdout?.on('data', data => {
    let messageString = data.toString()
    if (messageString.endsWith('\n')) messageString = messageString.substring(0, messageString.length - 1)

    messageString.split('\n').forEach((message: string) => {
      const isLogMessage = timestampRegex.test(message)

      const msgObj = {
        type: isLogMessage ? message.substring(10, 14) : 'SYSTEM',
        message: isLogMessage ? message.substring(17) : message,
        raw: message
      }

      if (msgObj.type === 'SYSTEM') msgObj.message = msgObj.message.bgYellow.black
      else if (msgObj.type === 'WARN') msgObj.message = msgObj.message.yellow
      else if (msgObj.type === 'ERRO') msgObj.message = msgObj.message.red

      else if (msgObj.message.startsWith('Environment: ')) msgObj.message = msgObj.message.bgMagenta
      else if (msgObj.message.endsWith('For help, type "help"')) {
        console.log(textSync('Server Started!', "Small Slant").yellow)
      }

      if (titleRegex.test(msgObj.message)) {
        msgObj.message = msgObj.message.replaceAll(titleRegex, (match) => {
          return match.bgCyan.black
        })
      }

      console.log(msgObj.message)

      // addToHistory({
      //   timestamp: new Date().getTime(),
      //   content: colours.strip(msgObj.raw),
      //   type: msgObj.type
      // })
    })
  })

  child.on('exit', (code, signal) => {
    console.log(`Server exited with code ${code},  signal ${signal}`)
  })

  child.on('error', (err) => {
    console.error('Failed to start server')
    console.error(err)
  })

  child.once('spawn', () => {
    if (child.stdin) {
      // @ts-ignore
      child.stdin.setEncoding('utf-8')

      // @ts-ignore
      // addWSSEventListener('onMessage', ({ data }) => {
      //   const { type, content } = data
      //
      //   if (type === 'command') {
      //     child.stdin.write(content + '\n')
      //   }
      // })
    }
  })
}