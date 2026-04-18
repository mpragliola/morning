import type { WeatherData } from '../types/weather'

const WMO: Record<number, string> = {
  0: 'Clear',
  1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Cloudy',
  45: 'Fog', 48: 'Icy Fog',
  51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
  61: 'Rain', 63: 'Rain', 65: 'Heavy Rain',
  71: 'Snow', 73: 'Snow', 75: 'Heavy Snow',
  80: 'Showers', 81: 'Showers', 82: 'Heavy Showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
}

export function wmoCondition(code: number): string {
  return WMO[code] ?? 'Unknown'
}

function timeFromISO(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('current', 'temperature_2m,weather_code')
  url.searchParams.set('daily', 'temperature_2m_min,temperature_2m_max,sunrise,sunset')
  url.searchParams.set('hourly', 'temperature_2m,weather_code')
  url.searchParams.set('forecast_days', '1')
  url.searchParams.set('timezone', 'auto')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Open-Meteo error ${res.status}`)
  const data = await res.json()

  const hourly: WeatherData['hourly'] = data.hourly.time
    .slice(0, 5)
    .map((time: string, i: number) => ({
      time,
      temp: data.hourly.temperature_2m[i],
      weatherCode: data.hourly.weather_code[i],
    }))

  return {
    current: {
      temp: data.current.temperature_2m,
      weatherCode: data.current.weather_code,
      condition: wmoCondition(data.current.weather_code),
    },
    today: {
      min: data.daily.temperature_2m_min[0],
      max: data.daily.temperature_2m_max[0],
      sunrise: timeFromISO(data.daily.sunrise[0]),
      sunset: timeFromISO(data.daily.sunset[0]),
    },
    hourly,
  }
}

// Reverse geocode using Open-Meteo's geocoding API. Falls back to coords string.
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lon))
    url.searchParams.set('format', 'json')
    url.searchParams.set('zoom', '10')

    const res = await fetch(url.toString(), {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'MorningDashboard/1.0' },
    })
    if (!res.ok) throw new Error('geocode failed')
    const data = await res.json()
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.county ||
      data.display_name?.split(',')[0] ||
      `${lat.toFixed(2)}, ${lon.toFixed(2)}`
    )
  } catch {
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`
  }
}
