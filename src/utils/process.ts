import * as colours from 'colors'
import {textSync} from "figlet";
import {spawn, StdioOptions} from "child_process";
import {addToHistory, addWSSEventListener, clearHistory, setServerState} from "../web_render";
import {getConfig, setHasConfigChanged} from "./config";
import {$t} from "./translations";
import {main} from "../index";
import {__error, __log} from "./logging";

const timestampRegex = /^\[\d{2}:\d{2}:\d{2} \D{4}]/is // [00:00:00 INFO]
const titleRegex = /\[\D+?]/gi // [Essentials] [Vault] [Harbor] etc
const doneRegex = /Done \(\d+.\d{3}s\)!/gmi // Done (4.832s)!

const spawnArgs = [
  '-Xms5000M',
  '-Xmx5000M',
  '-jar',
  'server.jar',
  'nogui'
]

const spawnOptions: { cwd: string, stdio: StdioOptions } = {
  cwd: './server',
  stdio: [
    'pipe',
    'pipe',
    'pipe'
  ]
}

let restartRequested = false

export async function startServer (javaPath: string, startNow = false) {

  if (!startNow && !getConfig().launcher_settings.auto_start) {
    __log(
      $t('info.auto_start_disabled')
    )
    setServerState('offline')
  } else {
    await _bootServer(javaPath)
  }

}

async function _bootServer(javaPath: string) {
  clearHistory()
  __log(textSync('Starting Server', "Small Slant").rainbow)

  let javaExec = '../bin/openjre/' + javaPath + '/bin/java'
  switch (process.platform) {
    case "win32":
      javaExec = javaExec + '.exe'
      break
  }

  setHasConfigChanged(false)

  const child = spawn(javaExec, spawnArgs, spawnOptions)
  setServerState('booting')

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

      if (doneRegex.test(message)) {
        __log(textSync('Server Started!', "Small Slant").yellow)
        setServerState('online')
      }

      if (titleRegex.test(message)) {
        msgObj.message = msgObj.message.replaceAll(titleRegex, (match) => {
          return match.bgCyan.black
        })
      }

      __log(msgObj.message)

      addToHistory({
        timestamp: new Date().getTime(),
        content: colours.strip(msgObj.raw),
        type: msgObj.type
      })
    })
  })

  child.on('exit', (code, signal) => {
    __log(`Server exited with code ${code},  signal ${signal}`)
    setServerState('offline')

    if (restartRequested) main(true)
  })

  child.on('error', (err) => {
    __error('Failed to start server')
    __error(err)

    setServerState('offline')
  })

  child.once('spawn', () => {
    if (child.stdin) {
      // @ts-ignore
      child.stdin.setEncoding('utf-8')

      addWSSEventListener('onMessage', ({ data }) => {
        if (!data) return
        const { type, content } = data

        if (type === 'command') {
          child.stdin?.write(content + '\n')
        }

        if (type === 'action' && ['stop', 'restart'].includes(content)) {
          if (content === 'restart') restartRequested = true
          child.stdin?.write('stop\n')
          setServerState('shutdown')
        }

        if (type === 'action' && content === 'force_stop') {
          child.kill()
          setServerState('shutdown')
        }
      })
    }
  })
}