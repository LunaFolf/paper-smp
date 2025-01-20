type PaperBuildsResponse = {
  project_id: 'paper',
  project_name: 'Paper',
  version: string,
  builds: PaperBuild[]
}

type PaperBuild = {
  build: number,
  time: string,
  channel: string,
  promoted: false,
  changes: object[],
  downloads: {
    application: {
      name: string,
      sha256: string
    },
    'mojang-mappings': {
      name: string,
      sha256: string
    }
  }
}