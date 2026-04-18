import type { CalendarEvent } from '../../types/google'
import { CalendarWidget } from './CalendarWidget'
import { TomorrowPreview } from './TomorrowPreview'

interface Props {
  events: CalendarEvent[]
  loading: boolean
  error: string | null
  tomorrowEvents: CalendarEvent[]
}

export function CenterPanel({ events, loading, error, tomorrowEvents }: Props) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-secondary)', flexShrink: 0 }}>
        {today}
      </h2>
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <CalendarWidget events={events} loading={loading} error={error} />
      </div>
      <TomorrowPreview events={tomorrowEvents} />
    </div>
  )
}
