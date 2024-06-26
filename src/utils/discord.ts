import {getUser, postOAuth} from "../api/discord";
import {getConfig} from "./config";

import {addAuthUser, addWSSEventListener} from "../web_render";
import {__debug} from "./logging";

addWSSEventListener('onMessage', async (callback) => {
  const { type, content } = callback.data

  if (type === 'discordAuth' && callback.ws) {
    const auth = await postOAuth(content)

    if (auth.access_token) {
      const user = await getUser(auth.access_token)

      const config = getConfig()

      if (!config.discord_ids || !config.discord_ids.includes(user.id)) return

      const authRecord: AuthRecord = {
        expiry: new Date().getTime() + auth.expires_in,
        auth_token: auth.access_token,
        refresh_token: auth.refresh_token,
        user,
        ws_client: callback.ws
      }

      addAuthUser(authRecord);
    }
  }
})