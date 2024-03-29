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

type ModrinthProjectVersion = {
  id: string,
  game_versions: string[],
  loaders: string[],
  project_id: ModrinthProject["id"],
  author_id: string,
  featured: boolean,
  name: string,
  version_number: string,
  changelog: string | null,
  changelog_url: string | null, // DEPRECIATED: Only kept for legacy compatibility. Will be null in all new stuff.
  date_published: string,
  downloads: number,
  version_type: "release" | "beta" | "alpha",
  status: "listed" | "archived" | "draft" | "unlisted" | "scheduled" | "unknown",
  requested_status: "listed" | "archived" | "draft" | "unlisted" | null,
  files: ModrinthFile[],
  dependencies: ModrinthVersionDependency[]

}