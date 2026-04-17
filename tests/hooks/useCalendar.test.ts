import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCalendar } from '../../src/hooks/useCalendar'
import * as calendarApi from '../../src/api/calendar'

describe('useCalendar', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('fetches events for given calendar IDs when token present', async () => {
    const mockEvents = [{ id: 'e1', summary: 'Standup', start: { dateTime: '2026-04-18T09:00:00Z' }, end: { dateTime: '2026-04-18T09:30:00Z' } }]
    vi.spyOn(calendarApi, 'fetchTodayEvents').mockResolvedValue(mockEvents)

    const { result } = renderHook(() => useCalendar('valid-token', ['primary']))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.events).toEqual(mockEvents)
    expect(result.current.error).toBeNull()
    expect(calendarApi.fetchTodayEvents).toHaveBeenCalledWith('valid-token', ['primary'])
  })

  it('skips fetch when token is null', () => {
    const spy = vi.spyOn(calendarApi, 'fetchTodayEvents')
    renderHook(() => useCalendar(null, ['primary']))
    expect(spy).not.toHaveBeenCalled()
  })

  it('skips fetch when calendarIds is empty', () => {
    const spy = vi.spyOn(calendarApi, 'fetchTodayEvents')
    renderHook(() => useCalendar('valid-token', []))
    expect(spy).not.toHaveBeenCalled()
  })

  it('exposes refresh() that re-fetches immediately', async () => {
    const mockEvents = [{ id: 'e1', summary: 'Standup', start: { dateTime: '2026-04-18T09:00:00Z' }, end: { dateTime: '2026-04-18T09:30:00Z' } }]
    const spy = vi.spyOn(calendarApi, 'fetchTodayEvents').mockResolvedValue(mockEvents)

    const { result } = renderHook(() => useCalendar('valid-token', ['primary']))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(spy).toHaveBeenCalledTimes(1)

    await act(async () => { await result.current.refresh() })
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
