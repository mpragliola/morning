// src/components/CenterPanel/CenterPanel.tsx
import type { CalendarEvent } from '../../types/google'
import { CalendarWidget } from './CalendarWidget'

interface Props {
  events: CalendarEvent[]
  loading: boolean
  error: string | null
}

export function CenterPanel({ events, loading, error }: Props) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-secondary)' }}>
        {today}
      </h2>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <CalendarWidget events={events} loading={loading} error={error} />
      </div>
    </div>
  )
}
