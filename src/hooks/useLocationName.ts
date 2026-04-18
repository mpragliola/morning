import { useState, useEffect } from 'react'
import { reverseGeocode } from '../api/weather'
import { Preferences } from '@capacitor/preferences'

const CACHE_KEY = 'location_name'

export function useLocationName(lat: number | null, lon: number | null): string | null {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    if (lat === null || lon === null) return

    // Return cached name immediately, then refresh in background
    Preferences.get({ key: CACHE_KEY }).then(({ value }) => {
      if (value) setName(value)
    })

    reverseGeocode(lat, lon).then(resolved => {
      setName(resolved)
      Preferences.set({ key: CACHE_KEY, value: resolved })
    })
  }, [lat, lon])

  return name
}
