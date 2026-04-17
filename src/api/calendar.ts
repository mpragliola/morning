import type { CalendarEvent, CalendarMeta } from '../types/google'
import { googleFetch } from './google'

function todayRange(): { startOfDay: string; endOfDay: string } {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
  return { startOfDay, endOfDay }
}

async function fetchEventsForCalendar(
  accessToken: string,
  calendarId: string,
  startOfDay: string,
  endOfDay: string
): Promise<CalendarEvent[]> {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  )
  url.searchParams.set('timeMin', startOfDay)
  url.searchParams.set('timeMax', endOfDay)
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('orderBy', 'startTime')
  url.searchParams.set('maxResults', '20')

  const res = await googleFetch(url.toString(), accessToken)
  const data = await res.json()
  return (data.items ?? []) as CalendarEvent[]
}

export async function fetchTodayEvents(
  accessToken: string,
  calendarIds: string[]
): Promise<CalendarEvent[]> {
  if (calendarIds.length === 0) return []

  const { startOfDay, endOfDay } = todayRange()

  const results = await Promise.all(
    calendarIds.map(id => fetchEventsForCalendar(accessToken, id, startOfDay, endOfDay))
  )

  return results
    .flat()
    .sort((a, b) => {
      const aTime = a.start.dateTime ?? a.start.date ?? ''
      const bTime = b.start.dateTime ?? b.start.date ?? ''
      return aTime.localeCompare(bTime)
    })
}

export async function fetchCalendarList(accessToken: string): Promise<CalendarMeta[]> {
  const res = await googleFetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50',
    accessToken
  )
  const data = await res.json()
  return (data.items ?? []).map((c: { id: string; summary: string; backgroundColor: string; foregroundColor: string }) => ({
    id: c.id,
    summary: c.summary,
    backgroundColor: c.backgroundColor ?? '#4285F4',
    foregroundColor: c.foregroundColor ?? '#ffffff',
  }))
}
