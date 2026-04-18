// src/components/CenterPanel/EventCard.tsx
import { useState } from 'react'
import type { CalendarEvent } from '../../types/google'
import { EventModal } from './EventModal'

interface Props { event: CalendarEvent }

const CALENDAR_COLORS: Record<string, string> = {
  '1': '#A4BDFC', '2': '#7AE7BF', '3': '#DBADFF', '4': '#FF887C',
  '5': '#FBD75B', '6': '#FFB878', '7': '#46D6DB', '8': '#E1E1E1',
  '9': '#5484ED', '10': '#51B749', '11': '#DC2127',
}

function formatTime(dt: string): string {
  return new Date(dt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function durationLabel(startDt: string, endDt: string): string {
  const diff = (new Date(endDt).getTime() - new Date(startDt).getTime()) / 60000
  if (diff < 60) return `${diff} min`
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function EventCard({ event }: Props) {
  const [open, setOpen] = useState(false)

  const isAllDay = !event.start.dateTime
  const startTime = isAllDay ? 'All day' : formatTime(event.start.dateTime!)
  const endTime = !isAllDay && event.end.dateTime ? formatTime(event.end.dateTime) : null
  const duration = !isAllDay && event.start.dateTime && event.end.dateTime
    ? durationLabel(event.start.dateTime, event.end.dateTime)
    : null
  const accentColor = event.colorId ? CALENDAR_COLORS[event.colorId] : '#A4BDFC'
  const firstLineDesc = event.description
    ? event.description.replace(/<[^>]*>/g, '').split('\n')[0].trim()
    : null

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{
          background: 'var(--card-bg)',
          borderRadius: 'var(--card-radius)',
          boxShadow: 'var(--card-shadow)',
          padding: '18px 20px',
          marginBottom: '12px',
          borderLeft: `5px solid ${accentColor}`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          cursor: 'pointer',
        }}
      >
        {/* Time column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '80px', paddingTop: '4px', gap: '4px' }}>
          <span style={{ fontSize: '28px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            {startTime}
          </span>
          {endTime && (
            <span style={{ fontSize: '18px', color: 'var(--text-secondary)', opacity: 0.7, whiteSpace: 'nowrap' }}>
              – {endTime}
            </span>
          )}
          {duration && (
            <span style={{ fontSize: '16px', color: 'var(--text-secondary)', opacity: 0.6, whiteSpace: 'nowrap' }}>
              {duration}
            </span>
          )}
        </div>

        {/* Content column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
          <span style={{ fontSize: '42px', fontWeight: 500, lineHeight: 1.2 }}>{event.summary}</span>
        </div>
      </div>

      {open && (
        <EventModal
          event={event}
          accentColor={accentColor}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
