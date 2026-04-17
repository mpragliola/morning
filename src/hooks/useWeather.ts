import { useState, useEffect } from 'react'
import { fetchWeather } from '../api/weather'
import type { WeatherData } from '../types/weather'

const POLL_MS = 5 * 60 * 1000

export function useWeather(lat: number | null, lon: number | null) {
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(lat !== null && lon !== null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (lat === null || lon === null) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const d = await fetchWeather(lat!, lon!)
        if (!cancelled) { setData(d); setError(null) }
      } catch {
        if (!cancelled) setError("Couldn't load weather. Retrying…")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const id = setInterval(load, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [lat, lon])

  return { data, loading, error }
}
