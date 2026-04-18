// src/components/LeftPanel/SunTimes.tsx
interface Props {
  sunrise: string  // HH:MM
  sunset: string   // HH:MM
  locationName: string | null
}

export function SunTimes({ sunrise, sunset, locationName }: Props) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
      {locationName && (
        <div style={{ fontSize: '18px', color: 'var(--text-secondary)', opacity: 0.7, marginBottom: '8px' }}>
          📍 {locationName}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
        <span style={{ fontSize: '20px', color: 'var(--text-secondary)', opacity: 0.8 }}>🌅 {sunrise}</span>
        <span style={{ fontSize: '20px', color: 'var(--text-secondary)', opacity: 0.8 }}>🌇 {sunset}</span>
      </div>
    </div>
  )
}
