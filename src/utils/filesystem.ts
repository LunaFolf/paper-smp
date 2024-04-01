import fs from "fs";

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

  console.log('Copying', fromBinPath, 'to', toServerPath);

  fs.copyFileSync(fromBinPath, toServerPath);

}}