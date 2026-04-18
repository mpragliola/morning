import { vi, test, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useTomorrowCalendar } from './useTomorrowCalendar'

vi.mock('../api/calendar', () => ({
  fetchEventsInRange: vi.fn(),
}))

import { fetchEventsInRange } from '../api/calendar'
const mockFetch = fetchEventsInRange as ReturnType<typeof vi.fn>

beforeEach(() => {
  mockFetch.mockReset()
})

test('fetches events for tomorrow and returns them', async () => {
  const tomorrowEvent = {
    id: 'tmr1',
    summary: 'Gym',
    start: { dateTime: '2026-04-19T10:00:00Z' },
    end: { dateTime: '2026-04-19T11:00:00Z' },
  }
  mockFetch.mockResolvedValue([tomorrowEvent])

  const { result } = renderHook(() =>
    useTomorrowCalendar('fake-token', ['primary'])
  )

  await waitFor(() => expect(result.current.loading).toBe(false))

  expect(result.current.events).toEqual([tomorrowEvent])
  expect(result.current.error).toBeNull()
})

test('calls fetchEventsInRange with tomorrow date range', async () => {
  mockFetch.mockResolvedValue([])

  const now = new Date()
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2)

  renderHook(() => useTomorrowCalendar('fake-token', ['primary']))

  await waitFor(() => expect(mockFetch).toHaveBeenCalled())

  const [, , timeMin, timeMax] = mockFetch.mock.calls[0]
  expect(new Date(timeMin).toDateString()).toBe(tomorrowStart.toDateString())
  expect(new Date(timeMax).toDateString()).toBe(tomorrowEnd.toDateString())
})

test('returns empty array when no calendarIds', async () => {
  const { result } = renderHook(() => useTomorrowCalendar('fake-token', []))
  expect(result.current.loading).toBe(false)
  expect(result.current.events).toEqual([])
})

test('returns empty array when no accessToken', async () => {
  const { result } = renderHook(() => useTomorrowCalendar(null, ['primary']))
  expect(result.current.loading).toBe(false)
  expect(result.current.events).toEqual([])
})

test('returns error string when fetch rejects', async () => {
  mockFetch.mockRejectedValue(new Error('network failure'))
  const { result } = renderHook(() => useTomorrowCalendar('fake-token', ['primary']))
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.error).toBe("Couldn't load tomorrow's events.")
  expect(result.current.events).toEqual([])
})
