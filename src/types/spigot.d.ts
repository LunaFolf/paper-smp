type SpigotResource = {
  id: number,
  external: boolean,
  file: {
    type: string,
    size: number,
    sizeUnit: string,
    url: string,
    externalUrl: string
  },
  description: string, // base64 encoded HTML
  testedVersions: string[]
}