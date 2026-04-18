import { useState, useEffect } from 'react'
import { fetchEventsInRange } from '../api/calendar'
import type { CalendarEvent } from '../types/google'

const POLL_MS = 5 * 60 * 1000

function tomorrowRange(): { timeMin: string; timeMax: string } {
  const now = new Date()
  const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
  const timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2).toISOString()
  return { timeMin, timeMax }
}

export function useTomorrowCalendar(accessToken: string | null, calendarIds: string[]) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(accessToken !== null && calendarIds.length > 0)
  const [error, setError] = useState<string | null>(null)

  const calendarKey = calendarIds.join(',')

  useEffect(() => {
    if (!accessToken || calendarIds.length === 0) return

    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const { timeMin, timeMax } = tomorrowRange()
        const data = await fetchEventsInRange(accessToken!, calendarIds, timeMin, timeMax)
        if (!cancelled) { setEvents(data); setError(null) }
      } catch {
        if (!cancelled) setError("Couldn't load tomorrow's events.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const id = setInterval(load, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [accessToken, calendarKey])

  return { events, loading, error }
}
