// Thin fetch wrapper that injects the Bearer token for Google API calls.
export async function googleFetch(
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    throw new Error(`Google API error ${res.status}: ${await res.text()}`)
  }
  return res
}
