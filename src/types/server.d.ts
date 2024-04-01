type ModLoader =
  'fabric' |
  'forge' |
  'liteloader' |
  'modloader' |
  'neoforge' |
  'rift' |
  'quilt'
type PluginLoader = 'bukkit' | 'folia' | 'paper' | 'purpur' | 'spigot'
type HybridLoader = 'sponge'

type serverConfig = {
  minecraft_version: string,
  mod_loader: ModLoader | PluginLoader | HybridLoader,
  plugins?: {
    essentials_x?: AvailableEssentialsXAssets[],
    spigot?: SpigotResource["id"][],
    modrinth?: ModrinthProject["id"][]
  },
  mods?: {
    modrinth?: ModrinthProject["id"][]
  }
}