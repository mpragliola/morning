import type { CalendarMeta } from '../../types/google'
import { CalendarToggleList } from './CalendarToggleList'

interface Props {
  calendars: CalendarMeta[]
  calendarsLoading: boolean
  calendarsError: string | null
  hiddenIds: Set<string>
  onToggleCalendar: (id: string) => void
  onRefresh: () => void
  onBack: () => void
}

export function PreferencesScreen({
  calendars,
  calendarsLoading,
  calendarsError,
  hiddenIds,
  onToggleCalendar,
  onRefresh,
  onBack,
}: Props) {
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      padding: '32px',
      overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', gap: '16px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'var(--card-bg)',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            fontSize: '20px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
          Preferences
        </h1>
        <button
          onClick={onRefresh}
          style={{
            background: 'var(--card-bg)',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            fontSize: '16px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          Refresh data
        </button>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Calendars
      </h2>
      <CalendarToggleList
        calendars={calendars}
        hiddenIds={hiddenIds}
        onToggle={onToggleCalendar}
        loading={calendarsLoading}
        error={calendarsError}
      />
    </div>
  )
}
