// src/components/LeftPanel/LeftPanel.tsx
import { ClockWidget } from './ClockWidget'
import { DateWidget } from './DateWidget'
import { WeatherWidget } from './WeatherWidget'
import type { WeatherData } from '../../types/weather'

interface Props {
  weather: WeatherData | null
  weatherLoading: boolean
  weatherError: string | null
}

export function LeftPanel({ weather, weatherLoading, weatherError }: Props) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ClockWidget />
      <DateWidget />
      <div style={{ flex: 1 }}>
        <WeatherWidget data={weather} loading={weatherLoading} error={weatherError} />
      </div>
    </div>
  )
}
