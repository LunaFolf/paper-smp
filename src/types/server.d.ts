type serverConfig = {
  minecraft_version: string,
  plugins: {
    essentials_x: AvailableEssentialsXAssets[],
    spigot: SpigotResource["id"][],
    modrinth: ModrinthProject["id"][]
  }
}