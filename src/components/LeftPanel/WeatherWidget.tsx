// src/components/LeftPanel/WeatherWidget.tsx
import type { WeatherData } from '../../types/weather'
import { CurrentWeather } from './CurrentWeather'
import { MinMax } from './MinMax'
import { HourlyStrip } from './HourlyStrip'
import { SunTimes } from './SunTimes'

interface Props {
  data: WeatherData | null
  loading: boolean
  error: string | null
  locationName: string | null
}

export function WeatherWidget({ data, loading, error, locationName }: Props) {
  if (loading) return <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Loading weather…</div>
  if (error) return <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px', fontSize: '15px' }}>{error}</div>
  if (!data) return null

  return (
    <div>
      <CurrentWeather temp={data.current.temp} condition={data.current.condition} weatherCode={data.current.weatherCode} />
      <MinMax min={data.today.min} max={data.today.max} />
      <SunTimes sunrise={data.today.sunrise} sunset={data.today.sunset} locationName={locationName} />
      <HourlyStrip slots={data.hourly} />
    </div>
  )
}
