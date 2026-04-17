// src/components/LeftPanel/MinMax.tsx
interface Props { min: number; max: number }

export function MinMax({ min, max }: Props) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', padding: '4px 0 12px' }}>
      <span style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>↓ {min}°</span>
      <span style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>↑ {max}°</span>
    </div>
  )
}
