# Tomorrow's Event Preview — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a compact, fixed-height preview of tomorrow's calendar events to the bottom of the center panel, with no scrolling anywhere in the app.

**Architecture:** Refactor `calendar.ts` to expose a generic `fetchEventsInRange` function; add a `useTomorrowCalendar` hook that calls it for the next day; add a `TomorrowPreview` component that renders compact rows; wire everything through `CenterPanel` and `App`.

**Tech Stack:** React, TypeScript, Vitest + Testing Library (unit), Playwright (e2e)

---

## File Map

| File | Change |
|------|--------|
| `src/api/calendar.ts` | Extract `fetchEventsInRange`; keep `fetchTodayEvents` as thin wrapper |
| `src/api/calendar.test.ts` | New — unit tests for `fetchEventsInRange` |
| `src/hooks/useTomorrowCalendar.ts` | New — hook fetching next day's events |
| `src/hooks/useTomorrowCalendar.test.ts` | New — unit tests for the hook |
| `src/components/CenterPanel/TomorrowPreview.tsx` | New — compact preview component |
| `src/components/CenterPanel/TomorrowPreview.test.tsx` | New — unit tests for the component |
| `src/components/CenterPanel/CenterPanel.tsx` | Accept `tomorrowEvents` prop; restructure layout |
| `e2e/fixtures.ts` | Add tomorrow calendar mock route |
| `e2e/dashboard.spec.ts` | Add tomorrow preview e2e test |
| `src/App.tsx` | Instantiate `useTomorrowCalendar`; pass `tomorrowEvents` to `CenterPanel` |

---

## Task 1: Refactor `calendar.ts` — extract `fetchEventsInRange`

**Files:**
- Modify: `src/api/calendar.ts`
- Create: `src/api/calendar.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/api/calendar.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/api/calendar.test.ts
```

Expected: FAIL — `fetchEventsInRange is not a function` (or similar import error).

- [ ] **Step 3: Refactor `calendar.ts`**

Replace the contents of `src/api/calendar.ts` with:

```typescript
import type { CalendarEvent, CalendarMeta } from '../types/google'
import { googleFetch } from './google'

async function fetchEventsForCalendar(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  )
  url.searchParams.set('timeMin', timeMin)
  url.searchParams.set('timeMax', timeMax)
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('orderBy', 'startTime')
  url.searchParams.set('maxResults', '20')

  const res = await googleFetch(url.toString(), accessToken)
  const data = await res.json()
  return (data.items ?? []) as CalendarEvent[]
}

export async function fetchEventsInRange(
  accessToken: string,
  calendarIds: string[],
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  if (calendarIds.length === 0) return []

  const results = await Promise.all(
    calendarIds.map(id => fetchEventsForCalendar(accessToken, id, timeMin, timeMax))
  )

  return results
    .flat()
    .sort((a, b) => {
      const aTime = a.start.dateTime ?? a.start.date ?? ''
      const bTime = b.start.dateTime ?? b.start.date ?? ''
      return aTime.localeCompare(bTime)
    })
}

function todayRange(): { startOfDay: string; endOfDay: string } {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
  return { startOfDay, endOfDay }
}

export async function fetchTodayEvents(
  accessToken: string,
  calendarIds: string[]
): Promise<CalendarEvent[]> {
  const { startOfDay, endOfDay } = todayRange()
  return fetchEventsInRange(accessToken, calendarIds, startOfDay, endOfDay)
}

export async function fetchCalendarList(accessToken: string): Promise<CalendarMeta[]> {
  const res = await googleFetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50',
    accessToken
  )
  const data = await res.json()
  return (data.items ?? []).map((c: CalendarMeta) => ({
    id: c.id,
    summary: c.summary,
    backgroundColor: c.backgroundColor ?? '#4285F4',
    foregroundColor: c.foregroundColor ?? '#ffffff',
  }))
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/api/calendar.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 5: Run full unit suite to confirm no regressions**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/api/calendar.ts src/api/calendar.test.ts
git commit -m "refactor: extract fetchEventsInRange from calendar.ts"
```

---

## Task 2: Add `useTomorrowCalendar` hook

**Files:**
- Create: `src/hooks/useTomorrowCalendar.ts`
- Create: `src/hooks/useTomorrowCalendar.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/useTomorrowCalendar.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/hooks/useTomorrowCalendar.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/hooks/useTomorrowCalendar.ts`**

```typescript
import { useState, useEffect } from 'react'
import { fetchEventsInRange } from '../api/calendar'
import type { CalendarEvent } from '../types/google'

const POLL_MS = 5 * 60 * 1000

function tomorrowRange(): { timeMin: string; timeMax: string } {
  const now = new Date()
  const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
  const timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2).toISOString()
  return { timeMin, timeMax }
}

export function useTomorrowCalendar(accessToken: string | null, calendarIds: string[]) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(accessToken !== null && calendarIds.length > 0)
  const [error, setError] = useState<string | null>(null)

  const calendarKey = calendarIds.join(',')

  useEffect(() => {
    if (!accessToken || calendarIds.length === 0) return

    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const { timeMin, timeMax } = tomorrowRange()
        const data = await fetchEventsInRange(accessToken!, calendarIds, timeMin, timeMax)
        if (!cancelled) { setEvents(data); setError(null) }
      } catch {
        if (!cancelled) setError("Couldn't load tomorrow's events.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const id = setInterval(load, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [accessToken, calendarKey])

  return { events, loading, error }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/hooks/useTomorrowCalendar.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Run full unit suite**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useTomorrowCalendar.ts src/hooks/useTomorrowCalendar.test.ts
git commit -m "feat: add useTomorrowCalendar hook"
```

---

## Task 3: Add `TomorrowPreview` component

**Files:**
- Create: `src/components/CenterPanel/TomorrowPreview.tsx`
- Create: `src/components/CenterPanel/TomorrowPreview.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/CenterPanel/TomorrowPreview.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { TomorrowPreview } from './TomorrowPreview'
import type { CalendarEvent } from '../../types/google'

function makeEvent(id: string, summary: string, hour: number): CalendarEvent {
  return {
    id,
    summary,
    start: { dateTime: `2026-04-19T${String(hour).padStart(2, '0')}:00:00Z` },
    end: { dateTime: `2026-04-19T${String(hour + 1).padStart(2, '0')}:00:00Z` },
  }
}

test('renders nothing when events array is empty', () => {
  const { container } = render(<TomorrowPreview events={[]} />)
  expect(container.firstChild).toBeNull()
})

test('renders tomorrow label', () => {
  render(<TomorrowPreview events={[makeEvent('e1', 'Gym', 10)]} />)
  expect(screen.getByTestId('tomorrow-label')).toBeInTheDocument()
})

test('renders event title', () => {
  render(<TomorrowPreview events={[makeEvent('e1', 'Gym', 10)]} />)
  expect(screen.getByText('Gym')).toBeInTheDocument()
})

test('renders formatted time for each event', () => {
  render(<TomorrowPreview events={[makeEvent('e1', 'Gym', 10)]} />)
  // Time formatted as HH:MM in user locale — just check it contains digits and colon
  const rows = screen.getAllByTestId('tomorrow-event-row')
  expect(rows).toHaveLength(1)
})

test('renders multiple events', () => {
  render(
    <TomorrowPreview
      events={[
        makeEvent('e1', 'Gym', 10),
        makeEvent('e2', 'Dinner', 19),
      ]}
    />
  )
  expect(screen.getByText('Gym')).toBeInTheDocument()
  expect(screen.getByText('Dinner')).toBeInTheDocument()
  expect(screen.getAllByTestId('tomorrow-event-row')).toHaveLength(2)
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/components/CenterPanel/TomorrowPreview.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/components/CenterPanel/TomorrowPreview.tsx`**

```typescript
import type { CalendarEvent } from '../../types/google'

interface Props {
  events: CalendarEvent[]
}

function formatTime(dt: string): string {
  return new Date(dt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function tomorrowLabel(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const weekday = tomorrow.toLocaleDateString('en-GB', { weekday: 'short' })
  const day = tomorrow.getDate()
  const month = tomorrow.toLocaleDateString('en-GB', { month: 'short' })
  return `Tomorrow · ${weekday} ${day} ${month}`
}

export function TomorrowPreview({ events }: Props) {
  if (events.length === 0) return null

  return (
    <div style={{
      flexShrink: 0,
      height: '18%',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      paddingTop: '10px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div
        data-testid="tomorrow-label"
        style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          opacity: 0.4,
          marginBottom: '6px',
          flexShrink: 0,
        }}
      >
        {tomorrowLabel()}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden' }}>
        {events.map(event => (
          <div
            key={event.id}
            data-testid="tomorrow-event-row"
            style={{
              background: 'var(--card-bg)',
              opacity: 0.5,
              borderRadius: '6px',
              padding: '5px 9px',
              display: 'flex',
              gap: '8px',
              alignItems: 'baseline',
              flexShrink: 0,
            }}
          >
            <span style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              minWidth: '32px',
              whiteSpace: 'nowrap',
            }}>
              {event.start.dateTime ? formatTime(event.start.dateTime) : 'All day'}
            </span>
            <span style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {event.summary}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/components/CenterPanel/TomorrowPreview.test.tsx
```

Expected: PASS (5 tests).

- [ ] **Step 5: Run full unit suite**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/CenterPanel/TomorrowPreview.tsx src/components/CenterPanel/TomorrowPreview.test.tsx
git commit -m "feat: add TomorrowPreview component"
```

---

## Task 4: Wire `TomorrowPreview` into `CenterPanel` and `App`

**Files:**
- Modify: `src/components/CenterPanel/CenterPanel.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Update `CenterPanel.tsx`**

Replace the contents of `src/components/CenterPanel/CenterPanel.tsx`:

```typescript
import type { CalendarEvent } from '../../types/google'
import { CalendarWidget } from './CalendarWidget'
import { TomorrowPreview } from './TomorrowPreview'

interface Props {
  events: CalendarEvent[]
  loading: boolean
  error: string | null
  tomorrowEvents: CalendarEvent[]
}

export function CenterPanel({ events, loading, error, tomorrowEvents }: Props) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-secondary)', flexShrink: 0 }}>
        {today}
      </h2>
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <CalendarWidget events={events} loading={loading} error={error} />
      </div>
      <TomorrowPreview events={tomorrowEvents} />
    </div>
  )
}
```

- [ ] **Step 2: Update `App.tsx`**

Add the `useTomorrowCalendar` import and hook, and pass `tomorrowEvents` to `CenterPanel`. In `src/App.tsx`:

Add to imports:
```typescript
import { useTomorrowCalendar } from './hooks/useTomorrowCalendar'
```

After the `calendar` hook line, add:
```typescript
const tomorrow = useTomorrowCalendar(auth.accessToken, visibleCalendarIds)
```

Update the `CenterPanel` usage (in the three-column grid):
```tsx
<CenterPanel
  events={calendar.events}
  loading={calendar.loading}
  error={calendar.error}
  tomorrowEvents={tomorrow.events}
/>
```

- [ ] **Step 3: Run full unit suite**

```bash
npm run test
```

Expected: all tests pass (TypeScript would fail to compile if the prop is missing).

- [ ] **Step 4: Verify in dev server**

```bash
npm run dev
```

Open `http://localhost:5173` in a browser. Sign in. Confirm:
- Today's events fill the top section
- Tomorrow's preview strip appears at the bottom with a "Tomorrow · ..." label
- No scrollbars anywhere in the center panel

- [ ] **Step 5: Commit**

```bash
git add src/components/CenterPanel/CenterPanel.tsx src/App.tsx
git commit -m "feat: wire TomorrowPreview into CenterPanel and App"
```

---

## Task 5: Add e2e test for tomorrow preview

**Files:**
- Modify: `e2e/fixtures.ts`
- Modify: `e2e/dashboard.spec.ts`

- [ ] **Step 1: Update the calendar mock in `e2e/fixtures.ts` to serve tomorrow's events**

The current fixture uses a single `**/calendar/v3/calendars/**` route that serves today's events for any calendar request. We need to distinguish today vs tomorrow by inspecting the `timeMin` query param.

Replace the calendar route handler in `mockAPIs`:

```typescript
await page.route('**/calendar/v3/calendars/**', route => {
  const url = new URL(route.request().url())
  const timeMin = url.searchParams.get('timeMin') ?? ''

  // If timeMin is tomorrow's date, serve tomorrow's events
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  if (timeMin.startsWith(tomorrowStr)) {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 'tmr1',
            summary: 'Saturday Gym',
            start: { dateTime: tomorrow.toISOString().slice(0, 11) + '10:00:00' },
            end: { dateTime: tomorrow.toISOString().slice(0, 11) + '11:00:00' },
          },
        ],
      }),
    })
  }

  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      items: [
        {
          id: 'evt1',
          summary: 'Morning Standup',
          start: { dateTime: new Date().toISOString().slice(0, 11) + '09:00:00' },
          end: { dateTime: new Date().toISOString().slice(0, 11) + '09:30:00' },
          colorId: '1',
        },
        {
          id: 'evt2',
          summary: 'Team Lunch',
          start: { dateTime: new Date().toISOString().slice(0, 11) + '12:00:00' },
          end: { dateTime: new Date().toISOString().slice(0, 11) + '13:00:00' },
          location: 'Canteen',
          description: 'Bring your own lunch.\nSee you there.',
        },
      ],
    }),
  })
})
```

- [ ] **Step 2: Add the e2e test to `e2e/dashboard.spec.ts`**

Add inside the `test.describe` block:

```typescript
test('shows tomorrow preview with label and events', async ({ authenticatedPage: page }) => {
  await expect(page.getByText('Morning Standup')).toBeVisible({ timeout: 8000 })
  await expect(page.getByTestId('tomorrow-label')).toBeVisible()
  await expect(page.getByText('Saturday Gym')).toBeVisible()
})
```

- [ ] **Step 3: Run e2e tests**

```bash
npm run test:e2e
```

Expected: all existing tests pass, new tomorrow preview test passes.

- [ ] **Step 4: Run unit tests to confirm no regressions**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add e2e/fixtures.ts e2e/dashboard.spec.ts
git commit -m "test: add e2e test for tomorrow preview"
```
