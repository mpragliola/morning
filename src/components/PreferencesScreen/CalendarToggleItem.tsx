import type { CalendarMeta } from '../../types/google'

interface Props {
  calendar: CalendarMeta
  hidden: boolean
  onToggle: (id: string) => void
}

export function CalendarToggleItem({ calendar, hidden, onToggle }: Props) {
  return (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '14px 16px',
      background: 'var(--card-bg)',
      borderRadius: 'var(--card-radius)',
      boxShadow: 'var(--card-shadow)',
      marginBottom: '10px',
      cursor: 'pointer',
    }}>
      <span style={{
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        background: calendar.backgroundColor,
        flexShrink: 0,
      }} />
      <span style={{ flex: 1, fontSize: '20px', color: 'var(--text-primary)' }}>
        {calendar.summary}
      </span>
      <input
        type="checkbox"
        role="checkbox"
        checked={!hidden}
        onChange={() => onToggle(calendar.id)}
        style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#9A96AA' }}
      />
    </label>
  )
}
