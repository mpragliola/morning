// src/components/CenterPanel/CalendarWidget.tsx
import type { CalendarEvent } from '../../types/google'
import { EventCard } from './EventCard'

interface Props {
  events: CalendarEvent[]
  loading: boolean
  error: string | null
}

export function CalendarWidget({ events, loading, error }: Props) {
  if (loading) return <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Loading events…</div>
  if (error) return <div style={{ color: 'var(--text-secondary)', padding: '20px', fontSize: '15px' }}>{error}</div>
  if (events.length === 0) return (
    <div style={{ color: 'var(--text-secondary)', padding: '20px', fontSize: '18px', textAlign: 'center' }}>
      No events today
    </div>
  )

  return (
    <div>
      {events.map(event => <EventCard key={event.id} event={event} />)}
    </div>
  )
}
