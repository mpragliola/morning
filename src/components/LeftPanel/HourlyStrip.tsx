// src/components/LeftPanel/HourlyStrip.tsx
import type { HourlySlot } from '../../types/weather'
import { weatherEmoji } from './CurrentWeather'

interface Props { slots: HourlySlot[] }

export function HourlyStrip({ slots }: Props) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-around',
      padding: '12px 0',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      marginTop: '8px',
    }}>
      {slots.map(slot => (
        <div key={slot.time} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {slot.time.slice(11, 16)}
          </span>
          <span style={{ fontSize: '20px' }}>{weatherEmoji(slot.weatherCode)}</span>
          <span style={{ fontSize: '15px', fontWeight: 500 }}>{slot.temp}°</span>
        </div>
      ))}
    </div>
  )
}
