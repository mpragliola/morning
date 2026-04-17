import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCalendar } from '../../src/hooks/useCalendar'
import * as calendarApi from '../../src/api/calendar'

describe('useCalendar', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('fetches events when token present', async () => {
    const mockEvents = [{ id: 'e1', summary: 'Standup', start: { dateTime: '2026-04-17T09:00:00Z' }, end: { dateTime: '2026-04-17T09:30:00Z' } }]
    vi.spyOn(calendarApi, 'fetchTodayEvents').mockResolvedValue(mockEvents)

    const { result } = renderHook(() => useCalendar('valid-token'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.events).toEqual(mockEvents)
    expect(result.current.error).toBeNull()
  })

  it('skips fetch when token is null', () => {
    const spy = vi.spyOn(calendarApi, 'fetchTodayEvents')
    renderHook(() => useCalendar(null))
    expect(spy).not.toHaveBeenCalled()
  })
})
