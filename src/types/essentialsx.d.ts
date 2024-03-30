type AvailableEssentialsXAssets =
  'EssentialsX' |
  'EssentialsXAntiBuild' |
  'EssentialsXChat' |
  'EssentialsXDiscord' |
  'EssentialsXDiscordLink' |
  'EssentialsXGeoIP' |
  'EssentialsXProtect' |
  'EssentialsXSpawn' |
  'EssentialsXXMPP'

type EssentialsXAsset = {
  id: number,
  name: string,
  browser_download_url: string
}

type EssentialsXBuild = {
  id: number,
  tag_name: string,
  draft: Boolean,
  prerelease: Boolean,
  assets: EssentialsXAsset[]
}