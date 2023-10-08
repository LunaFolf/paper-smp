export async function writeToFile (reader: any, stream: any): Promise<void> {
  while (true) {
    const {done, value} = await reader.read();
    if (done) {
      stream.close();
      break;
    }
    stream.write(value)
  }
}