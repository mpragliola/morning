import type { CalendarMeta } from '../../types/google'
import { CalendarToggleItem } from './CalendarToggleItem'

interface Props {
  calendars: CalendarMeta[]
  hiddenIds: Set<string>
  onToggle: (id: string) => void
  loading: boolean
  error: string | null
}

export function CalendarToggleList({ calendars, hiddenIds, onToggle, loading, error }: Props) {
  if (loading) return <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Loading calendars…</div>
  if (error) return <div style={{ color: 'var(--text-secondary)', padding: '20px', fontSize: '15px' }}>{error}</div>
  if (calendars.length === 0) return <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>No calendars found.</div>

  return (
    <div>
      {calendars.map(cal => (
        <CalendarToggleItem
          key={cal.id}
          calendar={cal}
          hidden={hiddenIds.has(cal.id)}
          onToggle={onToggle}
        />
      ))}
    </div>
  )
}
