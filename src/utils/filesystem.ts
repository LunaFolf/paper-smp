import fs from "fs";
import archiver from "archiver";
import {__log} from "./logging";
import {getConfig} from "./config";

export function writeToFile(reader: any, stream: any): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // When no more data needs to be consumed, close the stream and resolve the Promise.
          stream.end(() => resolve());
          break;
        }

        // Buffer the data chunks.
        // If the internal buffer is full (stream.write() returns false), pause until 'drain' event is emitted.
        if (!stream.write(value)) {
          await new Promise<void>(resolve => stream.once('drain', resolve));
        }
      }
    } catch (error) {
      stream.close();
      reject(error);
    }
  });
}

export async function copyServerJar(fromBinPath: string, toServerPath: string): Promise<void> { {
  if (fs.existsSync(toServerPath)) fs.rmSync(toServerPath);

  __log('Copying', fromBinPath, 'to', toServerPath);

  fs.copyFileSync(fromBinPath, toServerPath);

}}

export async function createManifest(manifestObject: any): Promise<void> {
  if (fs.existsSync('./manifest.json')) fs.rmSync('./manifest.json');

  fs.writeFileSync('manifest.json', JSON.stringify(manifestObject, null, 2));
}

export async function createImportableZIP(filePaths: string[], outputPath: string): Promise<void> {
  __log('Starting zip archive for all mods')

  if (fs.existsSync(outputPath)) fs.rmSync(outputPath)

  const output = fs.createWriteStream(outputPath)

  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(output);
  for (const filePath of filePaths) {
    archive.file(filePath, { name: 'overrides/mods/' + (filePath.split('/').pop() || filePath) });
  }

  if (fs.existsSync('./manifest.json')) {
    archive.file('./manifest.json', { name: 'manifest.json' })
  }

  await archive.finalize();

  __log('All mods zipped, and available to download')
}