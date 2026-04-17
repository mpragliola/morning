// src/components/LeftPanel/DateWidget.tsx
export function DateWidget() {
  const now = new Date()
  const day = now.toLocaleDateString('en-GB', { weekday: 'long' })
  const date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ textAlign: 'center', paddingBottom: '24px' }}>
      <div style={{ fontSize: '28px', fontWeight: 500, color: 'var(--text-primary)' }}>{day}</div>
      <div style={{ fontSize: '18px', color: 'var(--text-secondary)', marginTop: '4px' }}>{date}</div>
    </div>
  )
}
