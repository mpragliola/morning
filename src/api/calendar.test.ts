import { vi, test, expect, beforeEach } from 'vitest'
import { fetchEventsInRange } from './calendar'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  mockFetch.mockReset()
})

test('fetchEventsInRange calls the correct calendar URL with timeMin and timeMax', async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ items: [] }),
  })

  const timeMin = '2026-04-19T00:00:00.000Z'
  const timeMax = '2026-04-20T00:00:00.000Z'

  await fetchEventsInRange('fake-token', ['primary'], timeMin, timeMax)

  const calledUrl = mockFetch.mock.calls[0][0] as string
  expect(calledUrl).toContain('calendars/primary/events')
  expect(calledUrl).toContain(`timeMin=${encodeURIComponent(timeMin)}`)
  expect(calledUrl).toContain(`timeMax=${encodeURIComponent(timeMax)}`)
})

test('fetchEventsInRange merges and sorts events from multiple calendars', async () => {
  mockFetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: 'b', summary: 'B', start: { dateTime: '2026-04-19T12:00:00Z' }, end: { dateTime: '2026-04-19T13:00:00Z' } }],
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: 'a', summary: 'A', start: { dateTime: '2026-04-19T09:00:00Z' }, end: { dateTime: '2026-04-19T10:00:00Z' } }],
      }),
    })

  const result = await fetchEventsInRange('fake-token', ['cal1', 'cal2'], '2026-04-19T00:00:00Z', '2026-04-20T00:00:00Z')

  expect(result).toHaveLength(2)
  expect(result[0].id).toBe('a')
  expect(result[1].id).toBe('b')
})
