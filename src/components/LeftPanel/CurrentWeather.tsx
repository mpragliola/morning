// src/components/LeftPanel/CurrentWeather.tsx
const WMO_EMOJI: Record<number, string> = {
  0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️',
  45: '🌫', 48: '🌫',
  51: '🌦', 53: '🌦', 55: '🌧',
  61: '🌧', 63: '🌧', 65: '🌧',
  71: '🌨', 73: '🌨', 75: '❄️',
  80: '🌦', 81: '🌦', 82: '⛈',
  95: '⛈', 96: '⛈', 99: '⛈',
}

export function weatherEmoji(code: number): string {
  return WMO_EMOJI[code] ?? '🌡'
}

interface Props {
  temp: number
  condition: string
  weatherCode: number
}

export function CurrentWeather({ temp, condition, weatherCode }: Props) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: '48px' }}>{weatherEmoji(weatherCode)}</div>
      <div style={{ fontSize: '48px', fontWeight: 300, lineHeight: 1 }}>{temp}°</div>
      <div style={{ fontSize: '18px', color: 'var(--text-secondary)', marginTop: '4px' }}>{condition}</div>
    </div>
  )
}
