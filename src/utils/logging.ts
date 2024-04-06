import path from "node:path";

require('colors')

import fs from 'fs'
import { DateTime } from 'luxon'
import strip from 'strip-color'
import {addToHistory} from "../web_render";

type LogType = 'warn' | 'debug' | 'depreciated' | 'error' | 'info'

const logPrefixes: { [k in LogType]: string } = {
  warn: 'WARN'.red.bgYellow,
  debug: 'DBUG'.rainbow.bgWhite,
  depreciated: 'DEAD'.yellow.bgRed,
  error: 'EROR'.bgRed.white,
  info: 'INFO'.bgBlue.white
}

const logsPath = path.join(process.cwd(), 'logs')

if (!fs.existsSync(logsPath)) fs.mkdirSync(logsPath)

function writeToLogs(logType: LogType, args: IArguments | any[]): string {
  // convert args to array
  args = Array.prototype.slice.call(args)

  const seen = new WeakSet(); // Track seen objects to avoid circular reference issues

  // Work out datetime using native JavaScript Date object
  const dt = new Date();
  const time = dt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const date = dt.toISOString().split('T')[0];
  const timestamp = dt.getTime();

  // Setup filepath and start the string to write to
  const filepath: string = logsPath + `/${date}.log`
  let stringToWrite: string = `[${time}] [${logPrefixes[logType]}] `

  // Parse the args and format them into a string
  for (const arg of args) {
    if (typeof arg === 'string') {
      stringToWrite += arg + ' '
    } else {
      console.debug(typeof arg, arg)
      const replacer = (key: any, value: object | null) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return "[Circular]";
          }
          seen.add(value);
        }
        return value;
      };
      stringToWrite += `\n${strip(JSON.stringify(arg, replacer, 2))}\n`
    }
  }

  stringToWrite += '\n' // Add a new line at the end of the log

  try {
    fs.writeFileSync(filepath, strip(stringToWrite), { flag: 'a' })
  } catch (err: any) {
    console.error(`Error writing to ${'datetime'.bgYellow} log file: ${err.message}`.red)
  }

  try {
    fs.writeFileSync(logsPath + '/latest.log', strip(stringToWrite), { flag: 'a' })
  } catch (err: any) {
    console.error(`Error writing to ${'latest'.bgYellow} log file: ${err.message}`.red)
  }

  addToHistory({
    timestamp,
    content: strip(stringToWrite).trim(),
    type: logType
  })

  return stringToWrite.trim()
}

export function __log(...args: any[]) {
  console.log(writeToLogs('info', args))
}

export function __warn(...args: any[]) {
  console.log(writeToLogs('warn', args))
}

export function __error(...args: any[]) {
  console.log(writeToLogs('error', args))
}

export function __debug(...args: any[]) {
  console.log(writeToLogs('debug', args))
}