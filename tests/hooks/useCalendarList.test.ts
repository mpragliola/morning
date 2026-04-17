import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCalendarList } from '../../src/hooks/useCalendarList'
import * as calendarApi from '../../src/api/calendar'

describe('useCalendarList', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('fetches calendars when token present', async () => {
    const mockCalendars = [
      { id: 'primary', summary: 'My Calendar', backgroundColor: '#4285F4', foregroundColor: '#ffffff' },
    ]
    vi.spyOn(calendarApi, 'fetchCalendarList').mockResolvedValue(mockCalendars)

    const { result } = renderHook(() => useCalendarList('valid-token'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.calendars).toEqual(mockCalendars)
    expect(result.current.error).toBeNull()
  })

  it('skips fetch when token is null', () => {
    const spy = vi.spyOn(calendarApi, 'fetchCalendarList')
    renderHook(() => useCalendarList(null))
    expect(spy).not.toHaveBeenCalled()
  })

  it('sets error on fetch failure', async () => {
    vi.spyOn(calendarApi, 'fetchCalendarList').mockRejectedValue(new Error('fail'))
    const { result } = renderHook(() => useCalendarList('valid-token'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toMatch(/calendars/)
    expect(result.current.calendars).toEqual([])
  })
})
