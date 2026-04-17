import { useState, useEffect } from 'react'
import { fetchCalendarList } from '../api/calendar'
import type { CalendarMeta } from '../types/google'

export function useCalendarList(accessToken: string | null) {
  const [calendars, setCalendars] = useState<CalendarMeta[]>([])
  const [loading, setLoading] = useState(accessToken !== null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) return
    let cancelled = false

    setLoading(true)
    fetchCalendarList(accessToken)
      .then(data => { if (!cancelled) { setCalendars(data); setError(null) } })
      .catch(() => { if (!cancelled) setError("Couldn't load calendars.") })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [accessToken])

  return { calendars, loading, error }
}
