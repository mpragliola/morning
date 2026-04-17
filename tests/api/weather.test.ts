import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchWeather, wmoCondition } from '../../src/api/weather'

describe('wmoCondition', () => {
  it('returns Clear for code 0', () => {
    expect(wmoCondition(0)).toBe('Clear')
  })
  it('returns Cloudy for code 3', () => {
    expect(wmoCondition(3)).toBe('Cloudy')
  })
  it('returns Rain for code 61', () => {
    expect(wmoCondition(61)).toBe('Rain')
  })
  it('returns Unknown for unrecognised code', () => {
    expect(wmoCondition(999)).toBe('Unknown')
  })
})

describe('fetchWeather', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('maps Open-Meteo response to WeatherData shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: { temperature_2m: 18, weather_code: 0 },
        daily: { temperature_2m_min: [12], temperature_2m_max: [22] },
        hourly: {
          time: ['2026-04-17T10:00', '2026-04-17T11:00', '2026-04-17T12:00',
                 '2026-04-17T13:00', '2026-04-17T14:00'],
          temperature_2m: [17, 18, 20, 21, 19],
          weather_code: [0, 0, 1, 1, 2],
        },
      }),
    }))

    const result = await fetchWeather(51.5, -0.1)
    expect(result.current.temp).toBe(18)
    expect(result.current.weatherCode).toBe(0)
    expect(result.current.condition).toBe('Clear')
    expect(result.today.min).toBe(12)
    expect(result.today.max).toBe(22)
    expect(result.hourly).toHaveLength(5)
    expect(result.hourly[0]).toEqual({ time: '2026-04-17T10:00', temp: 17, weatherCode: 0 })
  })
})
