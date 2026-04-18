import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchWeather, wmoCondition, reverseGeocode } from '../../src/api/weather'

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
        daily: { temperature_2m_min: [12], temperature_2m_max: [22], sunrise: ['2026-04-17T06:15'], sunset: ['2026-04-17T20:30'] },
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
    expect(result.today.sunrise).toBe('06:15')
    expect(result.today.sunset).toBe('20:30')
    expect(result.hourly).toHaveLength(5)
    expect(result.hourly[0]).toEqual({ time: '2026-04-17T10:00', temp: 17, weatherCode: 0 })
  })
})

describe('reverseGeocode', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('returns city name when present', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        address: { city: 'Milan', country: 'Italy' },
        display_name: 'Milan, Italy',
      }),
    }))
    const result = await reverseGeocode(45.46, 9.19)
    expect(result).toBe('Milan')
  })

  it('falls back to town when city absent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        address: { town: 'Lecco' },
        display_name: 'Lecco, Italy',
      }),
    }))
    const result = await reverseGeocode(45.85, 9.39)
    expect(result).toBe('Lecco')
  })

  it('falls back to coords when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    const result = await reverseGeocode(45.46, 9.19)
    expect(result).toBe('45.46, 9.19')
  })

  it('falls back to coords when response not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const result = await reverseGeocode(45.46, 9.19)
    expect(result).toBe('45.46, 9.19')
  })

  it('falls back to display_name first word when no address fields match', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        address: {},
        display_name: 'Somewhere, Region, Country',
      }),
    }))
    const result = await reverseGeocode(1.0, 2.0)
    expect(result).toBe('Somewhere')
  })
})
