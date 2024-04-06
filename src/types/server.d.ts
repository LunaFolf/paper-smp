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

type MinecraftSettings = {
  allow_flight: boolean,
  allow_nether: boolean,
  broadcast_console_to_ops: boolean,
  broadcast_rcon_to_ops: boolean,
  debug: boolean,
  difficulty: 'peaceful' | 'easy' | 'normal' | 'hard',
  enable_command_block: boolean,
  enable_jmx_monitoring: boolean,
  enable_query: boolean,
  enable_rcon: boolean,
  enable_status: boolean,
  enforce_secure_profile: boolean,
  enforce_whitelist: boolean,
  entity_broadcast_range_percentage: number,
  force_gamemode: boolean,
  function_permission_level: 0 | 1 | 2 | 3 | 4,
  gamemode: 'survival' | 'creative' | 'adventure' | 'spectator',
  generate_structures: boolean,
  generator_settings: string,
  hardcore: boolean,
  hide_online_players: boolean,
  initial_disabled_packs: string,
  initial_enabled_packs: string,
  level_name: string,
  level_seed: string,
  level_type: 'minecraft:normal' | 'minecraft:flat' | 'minecraft:large_biomes' | 'minecraft:amplified' | 'minecraft:single_biome_surface' | 'buffet' | 'default_1_1' | 'customized',
  log_ips: boolean,
  max_chained_neighbor_updates: number,
  max_players: number,
  max_tick_time: number,
  max_world_size: number,
  motd: string,
  network_compression_threshold: number,
  online_mode: boolean,
  op_permission_level: number,
  player_idle_timeout: number,
  prevent_proxy_connections: boolean
  pvp: boolean,
  'query.port': number,
  rate_limit: number,
  'rcon.password': string, // TODO: Find a better, more secure, way to store this
  'rcon.port': number,
  required_resource_pack: boolean,
  resource_pack: string,
  resource_pack_id: string,
  resource_pack_prompt: string,
  resource_pack_sha1: string,
  server_ip: string,
  server_port: number,
  simulation_distance: number,
  spawn_animals: boolean,
  spawn_monsters: boolean,
  spawn_npcs: boolean,
  spawn_protection: number,
  sync_chunk_writes: boolean,
  text_filtering_config: string,
  use_native_transport: boolean,
  view_distance: number,
  white_list: boolean
}

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
  },
  launcher_settings: {
    auto_start: boolean,
    auto_restart: boolean,
    check_for_updates: number,
    web_port: number,
    redirect_uri: string
  },
  game_settings: MinecraftSettings,
  discord_ids: string[]
}

type AuthRecord = {
  expiry: number,
  auth_token: string,
  user: object,
  ws_client: any
}