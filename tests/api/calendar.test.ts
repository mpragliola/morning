import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchTodayEvents } from '../../src/api/calendar'

describe('fetchTodayEvents', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('returns mapped events for today', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'evt1',
            summary: 'Standup',
            start: { dateTime: '2026-04-17T09:00:00Z' },
            end: { dateTime: '2026-04-17T09:30:00Z' },
            colorId: '1',
          },
        ],
      }),
    }))

    const events = await fetchTodayEvents('fake-token')
    expect(events).toHaveLength(1)
    expect(events[0].id).toBe('evt1')
    expect(events[0].summary).toBe('Standup')
    expect(events[0].start.dateTime).toBe('2026-04-17T09:00:00Z')
  })

  it('returns empty array when items missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }))
    const events = await fetchTodayEvents('fake-token')
    expect(events).toEqual([])
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    }))
    await expect(fetchTodayEvents('bad-token')).rejects.toThrow('401')
  })
})
