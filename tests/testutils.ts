import * as fs from 'fs'

export function removeServerDir() {
  if (fs.existsSync('../server')) fs.rmdirSync('../server')
}