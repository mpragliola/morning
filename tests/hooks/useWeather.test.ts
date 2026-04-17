import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useWeather } from '../../src/hooks/useWeather'
import * as weatherApi from '../../src/api/weather'

describe('useWeather', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('starts loading then returns data', async () => {
    const mockData = {
      current: { temp: 20, weatherCode: 0, condition: 'Clear' },
      today: { min: 15, max: 25 },
      hourly: [],
    }
    vi.spyOn(weatherApi, 'fetchWeather').mockResolvedValue(mockData)

    const { result } = renderHook(() => useWeather(51.5, -0.1))
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it('sets error on fetch failure', async () => {
    vi.spyOn(weatherApi, 'fetchWeather').mockRejectedValue(new Error('net fail'))
    const { result } = renderHook(() => useWeather(51.5, -0.1))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toMatch(/weather/)
    expect(result.current.data).toBeNull()
  })

  it('skips fetch when lat/lon are null', () => {
    const spy = vi.spyOn(weatherApi, 'fetchWeather')
    renderHook(() => useWeather(null, null))
    expect(spy).not.toHaveBeenCalled()
  })
})
