import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchTodayEvents, fetchCalendarList } from '../../src/api/calendar'

describe('fetchTodayEvents', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('returns mapped events for today from primary calendar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'evt1',
            summary: 'Standup',
            start: { dateTime: '2026-04-18T09:00:00Z' },
            end: { dateTime: '2026-04-18T09:30:00Z' },
            colorId: '1',
          },
        ],
      }),
    }))

    const events = await fetchTodayEvents('fake-token', ['primary'])
    expect(events).toHaveLength(1)
    expect(events[0].id).toBe('evt1')
    expect(events[0].summary).toBe('Standup')
  })

  it('returns empty array when items missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }))
    const events = await fetchTodayEvents('fake-token', ['primary'])
    expect(events).toEqual([])
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    }))
    await expect(fetchTodayEvents('fake-token', ['primary'])).rejects.toThrow('401')
  })

  it('fetches from multiple calendar IDs and merges results sorted by start time', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{ id: 'b', summary: 'Later', start: { dateTime: '2026-04-18T11:00:00Z' }, end: { dateTime: '2026-04-18T12:00:00Z' } }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{ id: 'a', summary: 'Earlier', start: { dateTime: '2026-04-18T09:00:00Z' }, end: { dateTime: '2026-04-18T10:00:00Z' } }],
        }),
      })
    )

    const events = await fetchTodayEvents('fake-token', ['cal1', 'cal2'])
    expect(events).toHaveLength(2)
    expect(events[0].id).toBe('a')
    expect(events[1].id).toBe('b')
  })

  it('returns empty array when calendarIds is empty', async () => {
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    const events = await fetchTodayEvents('fake-token', [])
    expect(events).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

describe('fetchCalendarList', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('returns list of calendar metadata', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          { id: 'primary', summary: 'My Calendar', backgroundColor: '#4285F4', foregroundColor: '#ffffff' },
          { id: 'cal2', summary: 'Work', backgroundColor: '#0F9D58', foregroundColor: '#ffffff' },
        ],
      }),
    }))

    const calendars = await fetchCalendarList('fake-token')
    expect(calendars).toHaveLength(2)
    expect(calendars[0].id).toBe('primary')
    expect(calendars[0].summary).toBe('My Calendar')
    expect(calendars[0].backgroundColor).toBe('#4285F4')
  })

  it('returns empty array when no items', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }))
    const calendars = await fetchCalendarList('fake-token')
    expect(calendars).toEqual([])
  })
})
