// src/components/CenterPanel/EventCard.tsx
import type { CalendarEvent } from '../../types/google'

interface Props { event: CalendarEvent }

const CALENDAR_COLORS: Record<string, string> = {
  '1': '#A4BDFC', '2': '#7AE7BF', '3': '#DBADFF', '4': '#FF887C',
  '5': '#FBD75B', '6': '#FFB878', '7': '#46D6DB', '8': '#E1E1E1',
  '9': '#5484ED', '10': '#51B749', '11': '#DC2127',
}

function formatEventTime(dt: string): string {
  return dt.slice(11, 16)
}

export function EventCard({ event }: Props) {
  const isAllDay = !event.start.dateTime
  const startTime = isAllDay ? 'All day' : formatEventTime(event.start.dateTime!)
  const accentColor = event.colorId ? CALENDAR_COLORS[event.colorId] : '#A4BDFC'

  return (
    <div style={{
      background: 'var(--card-bg)',
      borderRadius: 'var(--card-radius)',
      boxShadow: 'var(--card-shadow)',
      padding: '18px 20px',
      marginBottom: '12px',
      borderLeft: `5px solid ${accentColor}`,
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px',
    }}>
      <span style={{ fontSize: '28px', color: 'var(--text-secondary)', minWidth: '80px', paddingTop: '4px' }}>
        {startTime}
      </span>
      <span style={{ fontSize: '42px', fontWeight: 500, lineHeight: 1.2 }}>{event.summary}</span>
    </div>
  )
}
