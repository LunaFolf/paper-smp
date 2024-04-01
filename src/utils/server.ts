type MCLoaderSettings = {
  plugins: boolean,
  mods: boolean
}

type MCLoaderConfig = {
  [key in serverConfig["mod_loader"]]: MCLoaderSettings
}

const minecraftLoaderConfig: MCLoaderConfig = {
  // Main Mod Loaders
  fabric: {
    plugins: false,
    mods: true
  },
  forge: {
    plugins: false,
    mods: true
  },
  liteloader: {
    plugins: false,
    mods: true
  },
  modloader: {
    plugins: false,
    mods: true
  },
  neoforge: {
    plugins: false,
    mods: true
  },
  quilt: {
    plugins: false,
    mods: true
  },
  rift: {
    plugins: false,
    mods: true
  },
  // Main Plugin Loaders
  bukkit: {
    plugins: true,
    mods: false
  },
  folia: {
    plugins: true,
    mods: false
  },
  paper: {
    plugins: true,
    mods: false
  },
  purpur: {
    plugins: true,
    mods: false
  },
  spigot: {
    plugins: true,
    mods: false
  },
  // Other stuff
  sponge: {
    plugins: true,
    mods: true
  }
}

export function getLoaderSettings (loader: serverConfig["mod_loader"]): MCLoaderSettings {
  return minecraftLoaderConfig[loader]
}

export function canLoaderUsePlugins (loader: serverConfig["mod_loader"]): boolean {
  const { plugins } = getLoaderSettings(loader)
  return plugins
}

export function canLoaderUseMods (loader: serverConfig["mod_loader"]): boolean {
  const { mods } = getLoaderSettings(loader)
  return mods
}