// tests/hooks/useLocationName.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLocationName } from '../../src/hooks/useLocationName'
import * as weatherApi from '../../src/api/weather'

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn().mockResolvedValue({ value: null }),
    set: vi.fn().mockResolvedValue(undefined),
  },
}))

import { Preferences } from '@capacitor/preferences'

describe('useLocationName', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns null when lat/lon are null', () => {
    const spy = vi.spyOn(weatherApi, 'reverseGeocode')
    const { result } = renderHook(() => useLocationName(null, null))
    expect(result.current).toBeNull()
    expect(spy).not.toHaveBeenCalled()
  })

  it('returns cached name immediately from Preferences', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({ value: 'Milan' })
    vi.spyOn(weatherApi, 'reverseGeocode').mockResolvedValue('Milan')

    const { result } = renderHook(() => useLocationName(45.46, 9.19))
    await waitFor(() => expect(result.current).toBe('Milan'))
  })

  it('resolves and caches geocoded name', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({ value: null })
    vi.spyOn(weatherApi, 'reverseGeocode').mockResolvedValue('Rome')

    const { result } = renderHook(() => useLocationName(41.9, 12.5))
    await waitFor(() => expect(result.current).toBe('Rome'))
    expect(Preferences.set).toHaveBeenCalledWith({ key: 'location_name', value: 'Rome' })
  })

  it('falls back to coords string when geocode fails', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({ value: null })
    vi.spyOn(weatherApi, 'reverseGeocode').mockResolvedValue('41.90, 12.50')

    const { result } = renderHook(() => useLocationName(41.9, 12.5))
    await waitFor(() => expect(result.current).toBe('41.90, 12.50'))
  })
})
