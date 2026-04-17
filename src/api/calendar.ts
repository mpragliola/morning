import type { CalendarEvent } from '../types/google'
import { googleFetch } from './google'

export async function fetchTodayEvents(accessToken: string): Promise<CalendarEvent[]> {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
  url.searchParams.set('timeMin', startOfDay)
  url.searchParams.set('timeMax', endOfDay)
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('orderBy', 'startTime')
  url.searchParams.set('maxResults', '20')

  const res = await googleFetch(url.toString(), accessToken)
  const data = await res.json()
  return (data.items ?? []) as CalendarEvent[]
}
