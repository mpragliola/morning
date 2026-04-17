# Preferences Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a preferences screen (accessed via a gear icon) that lets the user select which Google Calendars to show, persisted across restarts, plus a manual refresh button.

**Architecture:** A `showPrefs` boolean in `App.tsx` switches between the dashboard and `PreferencesScreen`. A new `useCalendarList` hook fetches all the user's calendars; a new `useHiddenCalendars` hook reads/writes a JSON array of hidden calendar IDs to Capacitor Preferences. `fetchTodayEvents` is extended to accept a list of calendar IDs and fetches each in parallel. A gear icon is rendered as an absolutely-positioned button overlay on the dashboard.

**Tech Stack:** React 18, TypeScript, `@capacitor/preferences`, Google Calendar REST API v3, Vitest, React Testing Library.

---

## File Map

```
src/
  types/google.ts               — add CalendarMeta interface (id, summary, backgroundColor, foregroundColor)

  api/calendar.ts               — extend fetchTodayEvents to accept calendarIds[]; add fetchCalendarList()

  hooks/
    useCalendarList.ts          — fetch all user calendars once on mount
    useHiddenCalendars.ts       — read/write hidden calendar IDs from Capacitor Preferences
    useCalendar.ts              — pass visible calendar IDs to fetchTodayEvents; expose refresh()

  components/
    PreferencesScreen/
      PreferencesScreen.tsx     — full-screen prefs layout with back button + refresh
      CalendarToggleList.tsx    — list of calendars with toggle switches
      CalendarToggleItem.tsx    — single calendar row: color dot + name + toggle
    GearButton.tsx              — absolutely-positioned gear icon button

  App.tsx                       — add showPrefs state, GearButton, conditional render

tests/
  api/calendar.test.ts          — extend: fetchTodayEvents with calendarIds; fetchCalendarList
  hooks/useHiddenCalendars.test.ts
  hooks/useCalendarList.test.ts
  components/CalendarToggleItem.test.tsx
```

---

## Task 1: CalendarMeta type + API extensions

**Files:**
- Modify: `src/types/google.ts`
- Modify: `src/api/calendar.ts`
- Modify: `tests/api/calendar.test.ts`

- [ ] **Step 1: Add CalendarMeta to src/types/google.ts**

Open `src/types/google.ts` and append:

```typescript
export interface CalendarMeta {
  id: string
  summary: string
  backgroundColor: string
  foregroundColor: string
}
```

- [ ] **Step 2: Write failing tests for the API extensions**

Replace the entire `tests/api/calendar.test.ts` with:

```typescript
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
    const spy = vi.stubGlobal('fetch', vi.fn())
    const events = await fetchTodayEvents('fake-token', [])
    expect(events).toEqual([])
    expect(spy).not.toHaveBeenCalled()
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
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm test -- tests/api/calendar.test.ts
```
Expected: FAIL — `fetchCalendarList` not exported, `fetchTodayEvents` doesn't accept `calendarIds`.

- [ ] **Step 4: Replace src/api/calendar.ts**

```typescript
import type { CalendarEvent, CalendarMeta } from '../types/google'
import { googleFetch } from './google'

function todayRange(): { startOfDay: string; endOfDay: string } {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
  return { startOfDay, endOfDay }
}

async function fetchEventsForCalendar(
  accessToken: string,
  calendarId: string,
  startOfDay: string,
  endOfDay: string
): Promise<CalendarEvent[]> {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  )
  url.searchParams.set('timeMin', startOfDay)
  url.searchParams.set('timeMax', endOfDay)
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('orderBy', 'startTime')
  url.searchParams.set('maxResults', '20')

  const res = await googleFetch(url.toString(), accessToken)
  const data = await res.json()
  return (data.items ?? []) as CalendarEvent[]
}

export async function fetchTodayEvents(
  accessToken: string,
  calendarIds: string[]
): Promise<CalendarEvent[]> {
  if (calendarIds.length === 0) return []

  const { startOfDay, endOfDay } = todayRange()

  const results = await Promise.all(
    calendarIds.map(id => fetchEventsForCalendar(accessToken, id, startOfDay, endOfDay))
  )

  return results
    .flat()
    .sort((a, b) => {
      const aTime = a.start.dateTime ?? a.start.date ?? ''
      const bTime = b.start.dateTime ?? b.start.date ?? ''
      return aTime.localeCompare(bTime)
    })
}

export async function fetchCalendarList(accessToken: string): Promise<CalendarMeta[]> {
  const res = await googleFetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50',
    accessToken
  )
  const data = await res.json()
  return (data.items ?? []).map((c: { id: string; summary: string; backgroundColor: string; foregroundColor: string }) => ({
    id: c.id,
    summary: c.summary,
    backgroundColor: c.backgroundColor ?? '#4285F4',
    foregroundColor: c.foregroundColor ?? '#ffffff',
  }))
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- tests/api/calendar.test.ts
```
Expected: all 7 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/types/google.ts src/api/calendar.ts tests/api/calendar.test.ts
git commit -m "feat: extend calendar API — multi-calendar fetch and calendarList"
```

---

## Task 2: useHiddenCalendars hook

**Files:**
- Create: `src/hooks/useHiddenCalendars.ts`
- Create: `tests/hooks/useHiddenCalendars.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
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
    // wait for async load
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/hooks/useHiddenCalendars.test.ts
```
Expected: FAIL — `useHiddenCalendars` not found.

- [ ] **Step 3: Implement src/hooks/useHiddenCalendars.ts**

```typescript
import { useState, useEffect, useCallback } from 'react'
import { Preferences } from '@capacitor/preferences'

const PREFS_KEY = 'hidden_calendar_ids'

export function useHiddenCalendars() {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    Preferences.get({ key: PREFS_KEY }).then(({ value }) => {
      if (value) setHiddenIds(new Set(JSON.parse(value) as string[]))
    })
  }, [])

  const toggleHidden = useCallback((calendarId: string) => {
    setHiddenIds(prev => {
      const next = new Set(prev)
      if (next.has(calendarId)) {
        next.delete(calendarId)
      } else {
        next.add(calendarId)
      }
      Preferences.set({ key: PREFS_KEY, value: JSON.stringify([...next]) })
      return next
    })
  }, [])

  return { hiddenIds, toggleHidden }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/hooks/useHiddenCalendars.test.ts
```
Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useHiddenCalendars.ts tests/hooks/useHiddenCalendars.test.ts
git commit -m "feat: useHiddenCalendars — persist hidden calendar IDs in Preferences"
```

---

## Task 3: useCalendarList hook

**Files:**
- Create: `src/hooks/useCalendarList.ts`
- Create: `tests/hooks/useCalendarList.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// tests/hooks/useCalendarList.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/hooks/useCalendarList.test.ts
```
Expected: FAIL — `useCalendarList` not found.

- [ ] **Step 3: Implement src/hooks/useCalendarList.ts**

```typescript
import { useState, useEffect } from 'react'
import { fetchCalendarList } from '../api/calendar'
import type { CalendarMeta } from '../types/google'

export function useCalendarList(accessToken: string | null) {
  const [calendars, setCalendars] = useState<CalendarMeta[]>([])
  const [loading, setLoading] = useState(accessToken !== null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) return
    let cancelled = false

    setLoading(true)
    fetchCalendarList(accessToken)
      .then(data => { if (!cancelled) { setCalendars(data); setError(null) } })
      .catch(() => { if (!cancelled) setError("Couldn't load calendars.") })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [accessToken])

  return { calendars, loading, error }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/hooks/useCalendarList.test.ts
```
Expected: all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useCalendarList.ts tests/hooks/useCalendarList.test.ts
git commit -m "feat: useCalendarList — fetch user's Google Calendar list"
```

---

## Task 4: Update useCalendar to use calendarIds + expose refresh

**Files:**
- Modify: `src/hooks/useCalendar.ts`
- Modify: `tests/hooks/useCalendar.test.ts`

- [ ] **Step 1: Replace tests/hooks/useCalendar.test.ts**

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/hooks/useCalendar.test.ts
```
Expected: FAIL — signature mismatch and `refresh` not exposed.

- [ ] **Step 3: Replace src/hooks/useCalendar.ts**

```typescript
import { useState, useEffect, useCallback } from 'react'
import { fetchTodayEvents } from '../api/calendar'
import type { CalendarEvent } from '../types/google'

const POLL_MS = 5 * 60 * 1000

export function useCalendar(accessToken: string | null, calendarIds: string[]) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(accessToken !== null && calendarIds.length > 0)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const calendarKey = calendarIds.join(',')

  useEffect(() => {
    if (!accessToken || calendarIds.length === 0) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const data = await fetchTodayEvents(accessToken!, calendarIds)
        if (!cancelled) { setEvents(data); setError(null) }
      } catch {
        if (!cancelled) setError("Couldn't load events. Retrying…")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const id = setInterval(load, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [accessToken, calendarKey, tick])

  const refresh = useCallback(() => {
    setTick(t => t + 1)
  }, [])

  return { events, loading, error, refresh }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/hooks/useCalendar.test.ts
```
Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useCalendar.ts tests/hooks/useCalendar.test.ts
git commit -m "feat: useCalendar — accept calendarIds list and expose refresh()"
```

---

## Task 5: CalendarToggleItem component

**Files:**
- Create: `src/components/PreferencesScreen/CalendarToggleItem.tsx`
- Create: `tests/components/CalendarToggleItem.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// tests/components/CalendarToggleItem.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CalendarToggleItem } from '../../src/components/PreferencesScreen/CalendarToggleItem'
import type { CalendarMeta } from '../../src/types/google'

const cal: CalendarMeta = {
  id: 'cal1',
  summary: 'Work',
  backgroundColor: '#0F9D58',
  foregroundColor: '#ffffff',
}

describe('CalendarToggleItem', () => {
  it('renders calendar name', () => {
    render(<CalendarToggleItem calendar={cal} hidden={false} onToggle={vi.fn()} />)
    expect(screen.getByText('Work')).toBeInTheDocument()
  })

  it('shows checkbox checked when not hidden', () => {
    render(<CalendarToggleItem calendar={cal} hidden={false} onToggle={vi.fn()} />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('shows checkbox unchecked when hidden', () => {
    render(<CalendarToggleItem calendar={cal} hidden={true} onToggle={vi.fn()} />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('calls onToggle with calendar id when clicked', () => {
    const onToggle = vi.fn()
    render(<CalendarToggleItem calendar={cal} hidden={false} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('cal1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/components/CalendarToggleItem.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Implement CalendarToggleItem**

```tsx
// src/components/PreferencesScreen/CalendarToggleItem.tsx
import type { CalendarMeta } from '../../types/google'

interface Props {
  calendar: CalendarMeta
  hidden: boolean
  onToggle: (id: string) => void
}

export function CalendarToggleItem({ calendar, hidden, onToggle }: Props) {
  return (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '14px 16px',
      background: 'var(--card-bg)',
      borderRadius: 'var(--card-radius)',
      boxShadow: 'var(--card-shadow)',
      marginBottom: '10px',
      cursor: 'pointer',
    }}>
      <span style={{
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        background: calendar.backgroundColor,
        flexShrink: 0,
      }} />
      <span style={{ flex: 1, fontSize: '20px', color: 'var(--text-primary)' }}>
        {calendar.summary}
      </span>
      <input
        type="checkbox"
        role="checkbox"
        checked={!hidden}
        onChange={() => onToggle(calendar.id)}
        style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#9A96AA' }}
      />
    </label>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/components/CalendarToggleItem.test.tsx
```
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/PreferencesScreen/CalendarToggleItem.tsx tests/components/CalendarToggleItem.test.tsx
git commit -m "feat: CalendarToggleItem — calendar row with color dot and toggle"
```

---

## Task 6: PreferencesScreen assembly + GearButton + App wiring

**Files:**
- Create: `src/components/PreferencesScreen/CalendarToggleList.tsx`
- Create: `src/components/PreferencesScreen/PreferencesScreen.tsx`
- Create: `src/components/GearButton.tsx`
- Modify: `src/App.tsx`

No new tests for these — they are thin composition components. The logic is tested in the hook/item tests above.

- [ ] **Step 1: Create CalendarToggleList**

```tsx
// src/components/PreferencesScreen/CalendarToggleList.tsx
import type { CalendarMeta } from '../../types/google'
import { CalendarToggleItem } from './CalendarToggleItem'

interface Props {
  calendars: CalendarMeta[]
  hiddenIds: Set<string>
  onToggle: (id: string) => void
  loading: boolean
  error: string | null
}

export function CalendarToggleList({ calendars, hiddenIds, onToggle, loading, error }: Props) {
  if (loading) return <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Loading calendars…</div>
  if (error) return <div style={{ color: 'var(--text-secondary)', padding: '20px', fontSize: '15px' }}>{error}</div>
  if (calendars.length === 0) return <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>No calendars found.</div>

  return (
    <div>
      {calendars.map(cal => (
        <CalendarToggleItem
          key={cal.id}
          calendar={cal}
          hidden={hiddenIds.has(cal.id)}
          onToggle={onToggle}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create PreferencesScreen**

```tsx
// src/components/PreferencesScreen/PreferencesScreen.tsx
import type { CalendarMeta } from '../../types/google'
import { CalendarToggleList } from './CalendarToggleList'

interface Props {
  calendars: CalendarMeta[]
  calendarsLoading: boolean
  calendarsError: string | null
  hiddenIds: Set<string>
  onToggleCalendar: (id: string) => void
  onRefresh: () => void
  onBack: () => void
}

export function PreferencesScreen({
  calendars,
  calendarsLoading,
  calendarsError,
  hiddenIds,
  onToggleCalendar,
  onRefresh,
  onBack,
}: Props) {
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      padding: '32px',
      overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', gap: '16px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'var(--card-bg)',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            fontSize: '20px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
          Preferences
        </h1>
        <button
          onClick={onRefresh}
          style={{
            background: 'var(--card-bg)',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            fontSize: '16px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          Refresh data
        </button>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Calendars
      </h2>
      <CalendarToggleList
        calendars={calendars}
        hiddenIds={hiddenIds}
        onToggle={onToggleCalendar}
        loading={calendarsLoading}
        error={calendarsError}
      />
    </div>
  )
}
```

- [ ] **Step 3: Create GearButton**

```tsx
// src/components/GearButton.tsx
interface Props {
  onClick: () => void
}

export function GearButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label="Preferences"
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 100,
        background: 'rgba(255,255,255,0.08)',
        border: 'none',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        fontSize: '20px',
        cursor: 'pointer',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      ⚙
    </button>
  )
}
```

- [ ] **Step 4: Replace src/App.tsx**

```tsx
// src/App.tsx
import { useState } from 'react'
import { useGoogleAuth } from './hooks/useGoogleAuth'
import { useLocation } from './hooks/useLocation'
import { useWeather } from './hooks/useWeather'
import { useCalendar } from './hooks/useCalendar'
import { useTasks } from './hooks/useTasks'
import { useCalendarList } from './hooks/useCalendarList'
import { useHiddenCalendars } from './hooks/useHiddenCalendars'
import { LeftPanel } from './components/LeftPanel/LeftPanel'
import { CenterPanel } from './components/CenterPanel/CenterPanel'
import { RightPanel } from './components/RightPanel/RightPanel'
import { PreferencesScreen } from './components/PreferencesScreen/PreferencesScreen'
import { GearButton } from './components/GearButton'

export default function App() {
  const [showPrefs, setShowPrefs] = useState(false)

  const auth = useGoogleAuth()
  const { lat, lon } = useLocation()
  const weather = useWeather(lat, lon)
  const { hiddenIds, toggleHidden } = useHiddenCalendars()
  const calendarList = useCalendarList(auth.accessToken)
  const visibleCalendarIds = calendarList.calendars
    .filter(c => !hiddenIds.has(c.id))
    .map(c => c.id)
  const calendar = useCalendar(auth.accessToken, visibleCalendarIds)
  const tasks = useTasks(auth.accessToken)

  if (auth.loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <span style={{ fontSize: '24px', color: 'var(--text-secondary)' }}>Loading…</span>
      </div>
    )
  }

  if (!auth.accessToken) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: '16px' }}>
        <div style={{ fontSize: '28px', color: 'var(--text-primary)' }}>Morning Dashboard</div>
        {auth.error && <div style={{ fontSize: '16px', color: '#E57373' }}>{auth.error}</div>}
        <button
          onClick={auth.signIn}
          style={{
            marginTop: '8px',
            padding: '14px 32px',
            fontSize: '18px',
            borderRadius: '10px',
            border: 'none',
            background: 'var(--panel-left)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          Sign in with Google
        </button>
      </div>
    )
  }

  if (showPrefs) {
    return (
      <PreferencesScreen
        calendars={calendarList.calendars}
        calendarsLoading={calendarList.loading}
        calendarsError={calendarList.error}
        hiddenIds={hiddenIds}
        onToggleCalendar={toggleHidden}
        onRefresh={calendar.refresh}
        onBack={() => setShowPrefs(false)}
      />
    )
  }

  return (
    <>
      <GearButton onClick={() => setShowPrefs(true)} />
      <div style={{
        display: 'grid',
        gridTemplateColumns: '28% 44% 28%',
        height: '100vh',
        width: '100vw',
      }}>
        <div style={{ background: 'var(--panel-left)', padding: '24px', overflowY: 'auto' }}>
          <LeftPanel weather={weather.data} weatherLoading={weather.loading} weatherError={weather.error} />
        </div>
        <div style={{ background: 'var(--panel-center)', padding: '24px', overflowY: 'auto' }}>
          <CenterPanel events={calendar.events} loading={calendar.loading} error={calendar.error} />
        </div>
        <div style={{ background: 'var(--panel-right)', padding: '24px', overflowY: 'auto' }}>
          <RightPanel tasks={tasks.tasks} loading={tasks.loading} error={tasks.error} onToggle={tasks.toggleTask} />
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /home/marco/dev/morning && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 6: Run all tests**

```bash
npm test
```
Expected: all tests pass (previous 28 + new tests from tasks 1–5).

- [ ] **Step 7: Commit**

```bash
git add src/components/PreferencesScreen/ src/components/GearButton.tsx src/App.tsx
git commit -m "feat: preferences screen — calendar toggles, gear icon, refresh button"
```

---

## Self-Review

**Spec coverage:**
- Gear icon always visible on dashboard → `GearButton` fixed-position overlay ✓
- Replaces screen (no overlay/drawer) → `showPrefs` swap in App.tsx ✓
- Back arrow returns to dashboard → `onBack` prop ✓
- Calendar list fetched from Google → `useCalendarList` + `fetchCalendarList` ✓
- Toggle each calendar on/off → `CalendarToggleItem` + `useHiddenCalendars` ✓
- Remembered across restarts → Capacitor Preferences `hidden_calendar_ids` ✓
- Manual refresh button → `onRefresh` → `calendar.refresh()` → `tick` bump ✓
- Only visible calendars fetched → `visibleCalendarIds` filter in App.tsx ✓

**Placeholder scan:** None found. All code blocks are complete.

**Type consistency:**
- `CalendarMeta` defined in Task 1, used in Tasks 3, 5, 6 ✓
- `fetchTodayEvents(accessToken, calendarIds[])` defined in Task 1, called in Task 4 ✓
- `fetchCalendarList(accessToken)` defined in Task 1, used in Task 3 ✓
- `useCalendar(accessToken, calendarIds[])` updated in Task 4, called in Task 6 ✓
- `hiddenIds: Set<string>` from Task 2, passed to Task 5 and Task 6 ✓
- `refresh()` exposed from `useCalendar` in Task 4, passed as `onRefresh` in Task 6 ✓
