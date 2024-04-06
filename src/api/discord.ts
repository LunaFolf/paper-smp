import {get, post} from "./http";
import {getConfig} from "../utils/config";

export async function postOAuth(code: string) {
  const { launcher_settings: { redirect_uri } } = getConfig()

  const response = await post(
    'https://discord.com/api/oauth2/token',
    {
      client_id: process.env.DISCORD_CLIENT_ID || '',
      client_secret: process.env.DISCORD_CLIENT_SECRET || '',
      code,
      redirect_uri,
      scope: 'identify',
      grant_type: 'authorization_code'
    }
  )
  if (!response) return null

  return await response.json()
}

export async function getUser(token: string) {
  const response = await get('https://discord.com/api/users/@me', undefined, {
    'Authorization': `Bearer ${token}`,
  })
  if (!response) return null

  return await response.json()
}

export async function refreshToken(refreshToken: string) {
  const response = await post(
    'https://discord.com/api/oauth2/token',
    {
      client_id: process.env.DISCORD_CLIENT_ID || '',
      client_secret: process.env.DISCORD_CLIENT_SECRET || '',
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }
  )
  if (!response) return null

  return await response.json()
}