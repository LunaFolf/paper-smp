import i18next from 'i18next'

i18next.init({
  lng: 'en',
  debug: false,
  resources: {
    en: {
      translation: {
        info: {
          auto_start_disabled: "Server auto-start is disabled. You can start the server via the web panel.",
          no_plugins_detected: "No plugins detected in server config... if you expected some, check you wrote it correctly.",
          no_mods_detected: "No mods detected in server config... if you expected some, check you wrote it correctly.",
          checking: {
            mod: "Checking mod: {{ modName }}"
          },
          downloading: {
            mod: "Download mod: {{ modName }}"
          },
          auto_creating_config: "No server-config.yml found, creating one for you."
        },
        errors: {
          modloaders: {
            plugins_not_supported: 'This modloader does not support plugins.',
            mods_not_supported: 'This modloader does not support mods.',
            modrinth: {
              unable_to_find: 'Unable to find resource with ID: {{ resourceID }}'
            }
          },
          no_builds: {
            paper: 'No Paper builds available for Minecraft Version {{version}}',
            fabric: 'No Fabric builds available for Minecraft Version {{version}}'
          },
          no_installer: {
            fabric: 'No installer builds available for Minecraft Version {{version}}'
          }
        }
      }
    }
  }
})

export function $t(key: string, variables?: {[key: string]: string}) {
  return i18next.t(key, variables)
}