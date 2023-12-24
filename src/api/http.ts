export async function get (url: string): Promise<Response | null> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'LunaFolf <luna@folf.io> discord: @lunafolf'
    }
  })
    .catch(err => {
      // TODO: Setup an error handler for more advanced error handling/reporting/logging/etc
      console.error('Error fetching', url, err.message)
      return
    })

  if (!response) return null // TODO: Just... Do this better...

  if (!response.ok) {
    console.error('Error fetching', url)
    console.error(response)
    return null
  }

  return response
}