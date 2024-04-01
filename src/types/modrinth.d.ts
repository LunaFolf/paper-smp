type ModrinthProject = {
  id: string
}

type ModrinthFile = {
  hashes: {
    sha512: string,
    sha1: string
  },
  url: string,
  filename: string,
  primary: boolean,
  size: number,
  file_type: string | null
}

type ModrinthVersionDependency = {
  version_id: string | null,
  project_id: string | null,
  file_name: string | null,
  dependency_type: "required" | "optional" | "incompatible" | "embedded"
}

type ModrinthPluginType = "mod" | "plugin" | "datapack" | "shader" | "resourcepack" | "modpack"

// interface ModrinthPluginVersionV3 {
//   id: string,
//   project_id: string,
//   author_id: string,
//   featured: boolean,
//   name: string,
//   version_number: string,
//   project_types: [ ModrinthPluginType ],
//   games: [ "minecraft-java" ],
//   changelog: string,
//   date_published: string,
//   downloads: number,
//   version_type: "release" | "beta" | "alpha",
//   status: "listed" | "archived" | "draft" | "unlisted" | "scheduled" | "unknown",
//   requested_status: "listed" | "archived" | "draft" | "unlisted" | null,
//   files: ModrinthFile[],
//   dependencies: ModrinthVersionDependency[],
//   loaders: serverConfig["mod_loader"][],
//   ordering: null,
//   game_versions: serverConfig["minecraft_version"][]
// }

interface ModrinthProjectVersion {
  name: string,
  version_number: string,
  changelog: string | null,
  dependencies: ModrinthVersionDependency[],
  game_versions: serverConfig["minecraft_version"][],
  version_type: "release" | "beta" | "alpha",
  loaders: serverConfig["mod_loader"][],
  featured: boolean,
  status: "listed" | "archived" | "draft" | "unlisted" | "scheduled" | "unknown",
  requested_status: "listed" | "archived" | "draft" | "unlisted" | null,
  id: string,
  project_id: string,
  author_id: string,
  date_published: string,
  downloads: number,
  changelog_url: string | null,
  files: ModrinthFile[]
}