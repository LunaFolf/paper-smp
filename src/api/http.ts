function convertToUrlParams(params?: urlParams): URLSearchParams {
  const urlParams = new URLSearchParams()

  if (!params) return urlParams

  for (const [key, value] of Object.entries(params)) {
    if (value.toString().length) urlParams.set(key, value?.toString() || JSON.stringify(value))
  }

  return urlParams
}

export async function get(url: string, params?: urlParams): Promise<Response | null> {
  try {
    const urlParams = convertToUrlParams(params)

    const headers = {
      'User-Agent': 'LunaFolf <luna@folf.io> discord: @lunafolf'
    }

    const fetchURL = url + '?' + new URLSearchParams(urlParams)

    // console.debug({
    //   fetchURL,
    //   urlParams,
    //   url,
    //   params,
    //   headers
    // })

    return await fetch(fetchURL, {headers})
  } catch (error) {
    console.error(error)
    return null
  }
}