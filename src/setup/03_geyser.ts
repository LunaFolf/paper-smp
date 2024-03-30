import {getLatestFloodgate, getLatestGeyser} from "../api/geyser";

export async function checkForLatestGeyser () {
  const latestGeyser = await getLatestGeyser()
  const latestFloodgate = await getLatestFloodgate()

  if (!latestGeyser || !latestFloodgate) throw new Error(`No releases available`)

  return {latestGeyser, latestFloodgate}
}