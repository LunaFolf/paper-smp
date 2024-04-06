import {__error} from "../utils/logging";

function convertToUrlParams(params?: urlParams): URLSearchParams {
  const urlParams = new URLSearchParams()

  if (!params) return urlParams

  for (const [key, value] of Object.entries(params)) {
    if (value.toString().length) urlParams.set(key, value?.toString() || JSON.stringify(value))
  }

  return urlParams
}

export async function get(url: string, params?: urlParams, headers?: object): Promise<Response | null> {
  try {
    const urlParams = convertToUrlParams(params)

    const finalHeaders = {
      'User-Agent': 'LunaFolf <luna@folf.io> discord: @lunafolf',
      ...headers
    }

    const fetchURL = url + '?' + new URLSearchParams(urlParams)

    // __debug({
    //   fetchURL,
    //   urlParams,
    //   url,
    //   params,
    //   headers
    // })

    return await fetch(fetchURL, {headers: finalHeaders})
  } catch (error) {
    __error(error)
    return null
  }
}

export async function post(url: string, body?: { [key: string]: string }, headers?: object): Promise<Response | null> {
  try {
    const finalHeaders = {
      'User-Agent': 'LunaFolf <luna@folf.io> discord: @lunafolf',
      'Content-Type': 'application/x-www-form-urlencoded',
      ...headers
    }

    const newBody = new URLSearchParams(body)

    // __debug({
    //   url,
    //   finalHeaders,
    //   newBody
    // })

    return await fetch(url, {
      headers: finalHeaders,
      method: 'POST',
      body: newBody
    })
  } catch (error) {
    __error(error)
    return null
  }
}