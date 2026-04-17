import { useState, useEffect } from 'react'
import { Preferences } from '@capacitor/preferences'

const LAT_KEY = 'location_lat'
const LON_KEY = 'location_lon'

export interface LocationState {
  lat: number | null
  lon: number | null
  error: string | null
}

export function useLocation(): LocationState {
  const [lat, setLat] = useState<number | null>(null)
  const [lon, setLon] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOrFetch()
  }, [])

  async function loadOrFetch() {
    const { value: storedLat } = await Preferences.get({ key: LAT_KEY })
    const { value: storedLon } = await Preferences.get({ key: LON_KEY })

    if (storedLat && storedLon) {
      setLat(Number(storedLat))
      setLon(Number(storedLon))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        await Preferences.set({ key: LAT_KEY, value: String(latitude) })
        await Preferences.set({ key: LON_KEY, value: String(longitude) })
        setLat(latitude)
        setLon(longitude)
      },
      () => setError("Couldn't get location. Weather unavailable.")
    )
  }

  return { lat, lon, error }
}
