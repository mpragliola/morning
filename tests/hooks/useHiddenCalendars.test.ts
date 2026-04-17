// tests/hooks/useHiddenCalendars.test.ts
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useHiddenCalendars } from '../../src/hooks/useHiddenCalendars'

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn().mockResolvedValue({ value: null }),
    set: vi.fn().mockResolvedValue(undefined),
  },
}))

import { Preferences } from '@capacitor/preferences'

describe('useHiddenCalendars', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('starts with empty set when nothing stored', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({ value: null })
    const { result } = renderHook(() => useHiddenCalendars())
    await act(async () => {})
    expect(result.current.hiddenIds).toEqual(new Set())
  })

  it('loads stored hidden IDs on mount', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({ value: JSON.stringify(['cal1', 'cal2']) })
    const { result } = renderHook(() => useHiddenCalendars())
    await act(async () => {})
    expect(result.current.hiddenIds).toEqual(new Set(['cal1', 'cal2']))
  })

  it('toggleHidden adds an ID that was visible', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({ value: null })
    const { result } = renderHook(() => useHiddenCalendars())
    await act(async () => {})
    await act(async () => { result.current.toggleHidden('cal1') })
    expect(result.current.hiddenIds).toEqual(new Set(['cal1']))
    expect(Preferences.set).toHaveBeenCalledWith({
      key: 'hidden_calendar_ids',
      value: JSON.stringify(['cal1']),
    })
  })

  it('toggleHidden removes an ID that was hidden', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({ value: JSON.stringify(['cal1']) })
    const { result } = renderHook(() => useHiddenCalendars())
    await act(async () => {})
    await act(async () => { result.current.toggleHidden('cal1') })
    expect(result.current.hiddenIds).toEqual(new Set())
    expect(Preferences.set).toHaveBeenCalledWith({
      key: 'hidden_calendar_ids',
      value: JSON.stringify([]),
    })
  })
})
