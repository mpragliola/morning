import { useState, useEffect, useCallback } from 'react'
import { fetchTodayEvents } from '../api/calendar'
import type { CalendarEvent } from '../types/google'

const POLL_MS = 5 * 60 * 1000

export function useCalendar(accessToken: string | null, calendarIds: string[]) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(accessToken !== null && calendarIds.length > 0)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const calendarKey = calendarIds.join(',')

  useEffect(() => {
    if (!accessToken || calendarIds.length === 0) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const data = await fetchTodayEvents(accessToken!, calendarIds)
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
  }, [accessToken, calendarKey, tick])

  const refresh = useCallback(() => {
    setTick(t => t + 1)
  }, [])

  return { events, loading, error, refresh }
}
