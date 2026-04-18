// src/components/CenterPanel/EventModal.tsx
import type { CalendarEvent } from '../../types/google'

interface Props {
  event: CalendarEvent
  accentColor: string
  onClose: () => void
}

function formatTime(dt: string): string {
  return dt.slice(11, 16)
}

function durationLabel(startDt: string, endDt: string): string {
  const diff = (new Date(endDt).getTime() - new Date(startDt).getTime()) / 60000
  if (diff < 60) return `${diff} min`
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function cleanDescription(desc: string): string {
  return desc.replace(/<[^>]*>/g, '').trim()
}

export function EventModal({ event, accentColor, onClose }: Props) {
  const isAllDay = !event.start.dateTime
  const startTime = isAllDay ? 'All day' : formatTime(event.start.dateTime!)
  const endTime = !isAllDay && event.end.dateTime ? formatTime(event.end.dateTime) : null
  const duration = !isAllDay && event.start.dateTime && event.end.dateTime
    ? durationLabel(event.start.dateTime, event.end.dateTime)
    : null
  const description = event.description ? cleanDescription(event.description) : null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#2A2A40',
          borderRadius: '20px',
          borderLeft: `6px solid ${accentColor}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          padding: '40px 44px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.1)',
            color: 'var(--text-secondary)',
            fontSize: '26px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
          aria-label="Close"
        >
          ×
        </button>

        {/* Title */}
        <h2 style={{ fontSize: '42px', fontWeight: 600, lineHeight: 1.2, paddingRight: '64px', color: 'var(--text-primary)' }}>
          {event.summary}
        </h2>

        {/* Time */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '32px', color: 'var(--text-secondary)' }}>
            {isAllDay ? 'All day' : `${startTime}${endTime ? ` – ${endTime}` : ''}`}
          </span>
          {duration && (
            <span style={{ fontSize: '22px', color: 'var(--text-secondary)', opacity: 0.6 }}>
              {duration}
            </span>
          )}
        </div>

        {/* Location */}
        {event.location && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '24px' }}>📍</span>
            <span style={{ fontSize: '24px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {event.location}
            </span>
          </div>
        )}

        {/* Description */}
        {description && (
          <div style={{
            fontSize: '22px',
            color: 'var(--text-secondary)',
            opacity: 0.85,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '20px',
          }}>
            {description}
          </div>
        )}
      </div>
    </div>
  )
}
