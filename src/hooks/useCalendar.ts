import { useState, useEffect } from 'react'
import { fetchTodayEvents } from '../api/calendar'
import type { CalendarEvent } from '../types/google'

const POLL_MS = 5 * 60 * 1000

export function useCalendar(accessToken: string | null) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(accessToken !== null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const data = await fetchTodayEvents(accessToken!)
        if (!cancelled) { setEvents(data); setError(null) }
      } catch {
        if (!cancelled) setError("Couldn't load events. Retrying…")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const id = setInterval(load, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [accessToken])

  return { events, loading, error }
}
