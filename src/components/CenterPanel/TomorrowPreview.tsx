import type { CalendarEvent } from '../../types/google'

interface Props {
  events: CalendarEvent[]
}

function formatTime(dt: string): string {
  return new Date(dt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function tomorrowLabel(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const weekday = tomorrow.toLocaleDateString('en-GB', { weekday: 'short' })
  const day = tomorrow.getDate()
  const month = tomorrow.toLocaleDateString('en-GB', { month: 'short' })
  return `Tomorrow · ${weekday} ${day} ${month}`
}

export function TomorrowPreview({ events }: Props) {
  if (events.length === 0) return null

  return (
    <div style={{
      flexShrink: 0,
      height: '18%',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      paddingTop: '10px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div
        data-testid="tomorrow-label"
        style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          opacity: 0.4,
          marginBottom: '6px',
          flexShrink: 0,
        }}
      >
        {tomorrowLabel()}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden' }}>
        {events.map(event => (
          <div
            key={event.id}
            data-testid="tomorrow-event-row"
            style={{
              background: 'var(--card-bg)',
              opacity: 0.5,
              borderRadius: '6px',
              padding: '5px 9px',
              display: 'flex',
              gap: '8px',
              alignItems: 'baseline',
              flexShrink: 0,
            }}
          >
            <span style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              minWidth: '32px',
              whiteSpace: 'nowrap',
            }}>
              {event.start.dateTime ? formatTime(event.start.dateTime) : 'All day'}
            </span>
            <span style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {event.summary}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
