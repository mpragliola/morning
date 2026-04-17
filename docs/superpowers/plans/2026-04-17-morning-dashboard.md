# Morning Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-screen kiosk React app showing clock, weather, Google Calendar events, and Google Tasks on a 10" landscape tablet, deployable as an Android APK via Capacitor.

**Architecture:** React 18 + TypeScript + Vite for the web layer; Capacitor 6 wraps it as an Android APK. All data fetched client-side — Google Calendar/Tasks via OAuth2 REST, weather via Open-Meteo (no key). Three-column pastel layout with large fonts.

**Tech Stack:** React 18, TypeScript, Vite, Capacitor 6, `@capacitor/google-auth`, `@capacitor/preferences`, Open-Meteo API, Google Calendar REST v3, Google Tasks REST v1, Vitest, React Testing Library.

---

## File Map

```
src/
  main.tsx                        — React root mount
  App.tsx                         — top-level layout (three columns)
  index.css                       — global reset + CSS variables (palette, fonts)

  hooks/
    useGoogleAuth.ts              — OAuth2 token lifecycle
    useCalendar.ts                — fetch today's events, 5-min polling
    useTasks.ts                   — fetch task list + mark complete, 5-min polling
    useWeather.ts                 — Open-Meteo fetch, 5-min polling
    useLocation.ts                — geolocation once on load, persisted

  api/
    google.ts                     — shared Google API fetch wrapper (auth header injection)
    calendar.ts                   — Google Calendar REST calls
    tasks.ts                      — Google Tasks REST calls
    weather.ts                    — Open-Meteo REST calls

  components/
    LeftPanel/
      LeftPanel.tsx
      ClockWidget.tsx             — live HH:MM, ticks every second
      DateWidget.tsx              — day name + full date
      WeatherWidget.tsx           — composes CurrentWeather + MinMax + HourlyStrip
      CurrentWeather.tsx          — icon, temp, condition label
      MinMax.tsx                  — today low/high
      HourlyStrip.tsx             — 5 upcoming hourly slots
    CenterPanel/
      CenterPanel.tsx
      CalendarWidget.tsx
      EventCard.tsx               — single event: time + title + calendar color
    RightPanel/
      RightPanel.tsx
      TasksWidget.tsx
      TaskCard.tsx                — tappable checkbox + title, strikethrough when done

  types/
    google.ts                     — CalendarEvent, Task interfaces
    weather.ts                    — WeatherData, HourlySlot interfaces

  config.ts                       — VITE_GOOGLE_CLIENT_ID env var read

tests/
  api/
    calendar.test.ts
    tasks.test.ts
    weather.test.ts
  hooks/
    useCalendar.test.ts
    useTasks.test.ts
    useWeather.test.ts
  components/
    ClockWidget.test.tsx
    EventCard.test.tsx
    TaskCard.test.tsx
    HourlyStrip.test.tsx

android/                          — Capacitor Android project (generated, not hand-edited)
capacitor.config.ts               — Capacitor config
.env.example                      — documents required env vars
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `.env.example`, `capacitor.config.ts`

- [ ] **Step 1: Scaffold Vite + React + TypeScript project**

```bash
cd /home/marco/dev/morning
npm create vite@latest . -- --template react-ts
npm install
```

Expected: `package.json`, `src/`, `index.html` created. `npm run dev` starts on localhost:5173.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install @capacitor/core@6 @capacitor/android@6 @capacitor/preferences@6 @capacitor/google-auth@3
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 4: Configure Vitest in vite.config.ts**

Replace `vite.config.ts` content:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 5: Create test setup file**

```typescript
// src/test-setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Add test script to package.json**

Open `package.json` and add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Create .env.example**

```bash
# .env.example
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

- [ ] **Step 8: Create capacitor.config.ts**

```typescript
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.personal.morningdashboard',
  appName: 'Morning Dashboard',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/tasks',
      ],
      serverClientId: process.env.VITE_GOOGLE_CLIENT_ID ?? '',
      forceCodeForRefreshToken: true,
    },
  },
}

export default config
```

- [ ] **Step 9: Initialise Capacitor Android project**

```bash
npx cap init "Morning Dashboard" "com.personal.morningdashboard" --web-dir dist
npx cap add android
```

- [ ] **Step 10: Verify dev server starts**

```bash
npm run dev
```
Expected: Vite dev server running at http://localhost:5173 with default React page.

- [ ] **Step 11: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Vite React TS + Capacitor project"
```

---

## Task 2: Global Styles & CSS Variables

**Files:**
- Modify: `src/index.css`
- Modify: `src/main.tsx`
- Create: `src/App.tsx` (replace scaffold)

- [ ] **Step 1: Replace src/index.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg: #1E1E2E;
  --panel-left: #252538;
  --panel-center: #26263A;
  --panel-right: #243328;
  --text-primary: #E8E4F0;
  --text-secondary: #9A96AA;
  --card-bg: rgba(255, 255, 255, 0.07);
  --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  --card-radius: 12px;
  --font: 'Inter', system-ui, sans-serif;
}

html, body, #root {
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: var(--bg);
  color: var(--text-primary);
  font-family: var(--font);
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 2: Replace src/App.tsx with three-column shell**

```tsx
// src/App.tsx
export default function App() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '28% 44% 28%',
      height: '100vh',
      width: '100vw',
      gap: 0,
    }}>
      <div style={{ background: 'var(--panel-left)', padding: '24px', overflowY: 'auto' }}>
        Left
      </div>
      <div style={{ background: 'var(--panel-center)', padding: '24px', overflowY: 'auto' }}>
        Center
      </div>
      <div style={{ background: 'var(--panel-right)', padding: '24px', overflowY: 'auto' }}>
        Right
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify layout in browser**

```bash
npm run dev
```
Expected: three pastel columns filling the screen with no scrollbars.

- [ ] **Step 4: Commit**

```bash
git add src/index.css src/App.tsx
git commit -m "feat: global styles and three-column layout shell"
```

---

## Task 3: Types

**Files:**
- Create: `src/types/google.ts`
- Create: `src/types/weather.ts`

- [ ] **Step 1: Create src/types/google.ts**

```typescript
export interface CalendarEvent {
  id: string
  summary: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  colorId?: string
  backgroundColor?: string
}

export interface Task {
  id: string
  title: string
  status: 'needsAction' | 'completed'
  due?: string
}

export interface TaskList {
  id: string
  title: string
}
```

- [ ] **Step 2: Create src/types/weather.ts**

```typescript
export interface HourlySlot {
  time: string        // ISO string
  temp: number        // celsius
  weatherCode: number // WMO code
}

export interface WeatherData {
  current: {
    temp: number
    weatherCode: number
    condition: string
  }
  today: {
    min: number
    max: number
  }
  hourly: HourlySlot[]  // next 5 hours
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript types for Google and weather data"
```

---

## Task 4: Config & API Utilities

**Files:**
- Create: `src/config.ts`
- Create: `src/api/google.ts`

- [ ] **Step 1: Create src/config.ts**

```typescript
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

if (!GOOGLE_CLIENT_ID) {
  console.warn('VITE_GOOGLE_CLIENT_ID is not set. Copy .env.example to .env and fill in your client ID.')
}
```

- [ ] **Step 2: Create src/api/google.ts**

```typescript
// Thin fetch wrapper that injects the Bearer token for Google API calls.
export async function googleFetch(
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    throw new Error(`Google API error ${res.status}: ${await res.text()}`)
  }
  return res
}
```

- [ ] **Step 3: Commit**

```bash
git add src/config.ts src/api/google.ts
git commit -m "feat: config and Google API fetch utility"
```

---

## Task 5: Weather API

**Files:**
- Create: `src/api/weather.ts`
- Create: `tests/api/weather.test.ts`

WMO weather code → human-readable label mapping is needed here.

- [ ] **Step 1: Write failing test**

```typescript
// tests/api/weather.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchWeather, wmoCondition } from '../../src/api/weather'

describe('wmoCondition', () => {
  it('returns Clear for code 0', () => {
    expect(wmoCondition(0)).toBe('Clear')
  })
  it('returns Cloudy for code 3', () => {
    expect(wmoCondition(3)).toBe('Cloudy')
  })
  it('returns Rain for code 61', () => {
    expect(wmoCondition(61)).toBe('Rain')
  })
  it('returns Unknown for unrecognised code', () => {
    expect(wmoCondition(999)).toBe('Unknown')
  })
})

describe('fetchWeather', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('maps Open-Meteo response to WeatherData shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: { temperature_2m: 18, weather_code: 0 },
        daily: { temperature_2m_min: [12], temperature_2m_max: [22] },
        hourly: {
          time: ['2026-04-17T10:00', '2026-04-17T11:00', '2026-04-17T12:00',
                 '2026-04-17T13:00', '2026-04-17T14:00'],
          temperature_2m: [17, 18, 20, 21, 19],
          weather_code: [0, 0, 1, 1, 2],
        },
      }),
    }))

    const result = await fetchWeather(51.5, -0.1)
    expect(result.current.temp).toBe(18)
    expect(result.current.weatherCode).toBe(0)
    expect(result.current.condition).toBe('Clear')
    expect(result.today.min).toBe(12)
    expect(result.today.max).toBe(22)
    expect(result.hourly).toHaveLength(5)
    expect(result.hourly[0]).toEqual({ time: '2026-04-17T10:00', temp: 17, weatherCode: 0 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/api/weather.test.ts
```
Expected: FAIL — `fetchWeather` and `wmoCondition` not found.

- [ ] **Step 3: Implement src/api/weather.ts**

```typescript
import type { WeatherData } from '../types/weather'

const WMO: Record<number, string> = {
  0: 'Clear',
  1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Cloudy',
  45: 'Fog', 48: 'Icy Fog',
  51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
  61: 'Rain', 63: 'Rain', 65: 'Heavy Rain',
  71: 'Snow', 73: 'Snow', 75: 'Heavy Snow',
  80: 'Showers', 81: 'Showers', 82: 'Heavy Showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
}

export function wmoCondition(code: number): string {
  return WMO[code] ?? 'Unknown'
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('current', 'temperature_2m,weather_code')
  url.searchParams.set('daily', 'temperature_2m_min,temperature_2m_max')
  url.searchParams.set('hourly', 'temperature_2m,weather_code')
  url.searchParams.set('forecast_days', '1')
  url.searchParams.set('timezone', 'auto')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Open-Meteo error ${res.status}`)
  const data = await res.json()

  const hourly: WeatherData['hourly'] = data.hourly.time
    .slice(0, 5)
    .map((time: string, i: number) => ({
      time,
      temp: data.hourly.temperature_2m[i],
      weatherCode: data.hourly.weather_code[i],
    }))

  return {
    current: {
      temp: data.current.temperature_2m,
      weatherCode: data.current.weather_code,
      condition: wmoCondition(data.current.weather_code),
    },
    today: {
      min: data.daily.temperature_2m_min[0],
      max: data.daily.temperature_2m_max[0],
    },
    hourly,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/api/weather.test.ts
```
Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/api/weather.ts tests/api/weather.test.ts
git commit -m "feat: Open-Meteo weather API with WMO condition mapping"
```

---

## Task 6: Google Calendar API

**Files:**
- Create: `src/api/calendar.ts`
- Create: `tests/api/calendar.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// tests/api/calendar.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/api/calendar.test.ts
```
Expected: FAIL — `fetchTodayEvents` not found.

- [ ] **Step 3: Implement src/api/calendar.ts**

```typescript
import type { CalendarEvent } from '../types/google'
import { googleFetch } from './google'

export async function fetchTodayEvents(accessToken: string): Promise<CalendarEvent[]> {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
  url.searchParams.set('timeMin', startOfDay)
  url.searchParams.set('timeMax', endOfDay)
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('orderBy', 'startTime')
  url.searchParams.set('maxResults', '20')

  const res = await googleFetch(url.toString(), accessToken)
  const data = await res.json()
  return (data.items ?? []) as CalendarEvent[]
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/api/calendar.test.ts
```
Expected: all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/api/calendar.ts tests/api/calendar.test.ts
git commit -m "feat: Google Calendar API — fetch today's events"
```

---

## Task 7: Google Tasks API

**Files:**
- Create: `src/api/tasks.ts`
- Create: `tests/api/tasks.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// tests/api/tasks.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchTasks, completeTask } from '../../src/api/tasks'

describe('fetchTasks', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('returns tasks from default task list', async () => {
    // First call: get task lists. Second call: get tasks.
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [{ id: 'list1', title: 'My Tasks' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            { id: 'task1', title: 'Buy milk', status: 'needsAction' },
            { id: 'task2', title: 'Read book', status: 'completed' },
          ],
        }),
      })
    )

    const tasks = await fetchTasks('fake-token')
    expect(tasks).toHaveLength(2)
    expect(tasks[0].id).toBe('task1')
    expect(tasks[0].status).toBe('needsAction')
    expect(tasks[1].status).toBe('completed')
  })

  it('returns empty array when no task lists', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    }))
    const tasks = await fetchTasks('fake-token')
    expect(tasks).toEqual([])
  })
})

describe('completeTask', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('sends PATCH with completed status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'task1', status: 'completed' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await completeTask('fake-token', 'list1', 'task1')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/lists/list1/tasks/task1'),
      expect.objectContaining({ method: 'PATCH' })
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/api/tasks.test.ts
```
Expected: FAIL — `fetchTasks` and `completeTask` not found.

- [ ] **Step 3: Implement src/api/tasks.ts**

```typescript
import type { Task } from '../types/google'
import { googleFetch } from './google'

// Fetches tasks from the user's default (first) task list.
export async function fetchTasks(accessToken: string): Promise<{ tasks: Task[]; listId: string }> {
  const listsRes = await googleFetch(
    'https://www.googleapis.com/tasks/v1/users/@me/lists?maxResults=1',
    accessToken
  )
  const listsData = await listsRes.json()
  const lists = listsData.items ?? []
  if (lists.length === 0) return { tasks: [], listId: '' }

  const listId: string = lists[0].id

  const tasksRes = await googleFetch(
    `https://www.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=true&maxResults=30`,
    accessToken
  )
  const tasksData = await tasksRes.json()
  return { tasks: (tasksData.items ?? []) as Task[], listId }
}

export async function completeTask(
  accessToken: string,
  listId: string,
  taskId: string
): Promise<void> {
  await googleFetch(
    `https://www.googleapis.com/tasks/v1/lists/${listId}/tasks/${taskId}`,
    accessToken,
    {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    }
  )
}
```

> **Note:** The test for `fetchTasks` in step 1 expects `fetchTasks` to return `Task[]` directly but the implementation returns `{ tasks, listId }`. Update the test's assertion to match:

```typescript
// In tests/api/tasks.test.ts, update fetchTasks assertions:
const result = await fetchTasks('fake-token')
expect(result.tasks).toHaveLength(2)
expect(result.tasks[0].id).toBe('task1')
expect(result.tasks[0].status).toBe('needsAction')
expect(result.tasks[1].status).toBe('completed')
// ...
const result2 = await fetchTasks('fake-token')
expect(result2.tasks).toEqual([])
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/api/tasks.test.ts
```
Expected: all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/api/tasks.ts tests/api/tasks.test.ts
git commit -m "feat: Google Tasks API — fetch tasks and mark complete"
```

---

## Task 8: useGoogleAuth Hook

**Files:**
- Create: `src/hooks/useGoogleAuth.ts`

> `@capacitor/google-auth` wraps OAuth2. In browser (dev), it uses a redirect/popup flow. The hook exposes `{ accessToken, signIn, signOut, loading, error }`.

- [ ] **Step 1: Create src/hooks/useGoogleAuth.ts**

```typescript
import { useState, useEffect, useCallback } from 'react'
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'
import { Preferences } from '@capacitor/preferences'

const TOKEN_KEY = 'google_access_token'
const EXPIRY_KEY = 'google_token_expiry'

export interface AuthState {
  accessToken: string | null
  loading: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

export function useGoogleAuth(): AuthState {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    GoogleAuth.initialize({
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scopes: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/tasks',
      ],
      grantOfflineAccess: true,
    })
    restoreToken()
  }, [])

  async function restoreToken() {
    try {
      const { value: token } = await Preferences.get({ key: TOKEN_KEY })
      const { value: expiry } = await Preferences.get({ key: EXPIRY_KEY })
      if (token && expiry && Date.now() < Number(expiry)) {
        setAccessToken(token)
      }
    } catch {
      // no stored token — user needs to sign in
    } finally {
      setLoading(false)
    }
  }

  const signIn = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const user = await GoogleAuth.signIn()
      const token = user.authentication.accessToken
      const expiry = Date.now() + 55 * 60 * 1000 // treat as 55-min lifetime
      await Preferences.set({ key: TOKEN_KEY, value: token })
      await Preferences.set({ key: EXPIRY_KEY, value: String(expiry) })
      setAccessToken(token)
    } catch (e) {
      setError('Sign-in failed. Tap to retry.')
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    await GoogleAuth.signOut()
    await Preferences.remove({ key: TOKEN_KEY })
    await Preferences.remove({ key: EXPIRY_KEY })
    setAccessToken(null)
  }, [])

  return { accessToken, loading, error, signIn, signOut }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useGoogleAuth.ts
git commit -m "feat: useGoogleAuth hook — OAuth2 token lifecycle with Capacitor"
```

---

## Task 9: useLocation Hook

**Files:**
- Create: `src/hooks/useLocation.ts`

- [ ] **Step 1: Create src/hooks/useLocation.ts**

```typescript
import { useState, useEffect } from 'react'
import { Preferences } from '@capacitor/preferences'

const LAT_KEY = 'location_lat'
const LON_KEY = 'location_lon'

export interface LocationState {
  lat: number | null
  lon: number | null
  error: string | null
}

export function useLocation(): LocationState {
  const [lat, setLat] = useState<number | null>(null)
  const [lon, setLon] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOrFetch()
  }, [])

  async function loadOrFetch() {
    const { value: storedLat } = await Preferences.get({ key: LAT_KEY })
    const { value: storedLon } = await Preferences.get({ key: LON_KEY })

    if (storedLat && storedLon) {
      setLat(Number(storedLat))
      setLon(Number(storedLon))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        await Preferences.set({ key: LAT_KEY, value: String(latitude) })
        await Preferences.set({ key: LON_KEY, value: String(longitude) })
        setLat(latitude)
        setLon(longitude)
      },
      () => setError("Couldn't get location. Weather unavailable.")
    )
  }

  return { lat, lon, error }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useLocation.ts
git commit -m "feat: useLocation hook — geolocation with Capacitor Preferences persistence"
```

---

## Task 10: Data Hooks (useWeather, useCalendar, useTasks)

**Files:**
- Create: `src/hooks/useWeather.ts`
- Create: `src/hooks/useCalendar.ts`
- Create: `src/hooks/useTasks.ts`
- Create: `tests/hooks/useWeather.test.ts`
- Create: `tests/hooks/useCalendar.test.ts`
- Create: `tests/hooks/useTasks.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/hooks/useWeather.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useWeather } from '../../src/hooks/useWeather'
import * as weatherApi from '../../src/api/weather'

describe('useWeather', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('starts loading then returns data', async () => {
    const mockData = {
      current: { temp: 20, weatherCode: 0, condition: 'Clear' },
      today: { min: 15, max: 25 },
      hourly: [],
    }
    vi.spyOn(weatherApi, 'fetchWeather').mockResolvedValue(mockData)

    const { result } = renderHook(() => useWeather(51.5, -0.1))
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it('sets error on fetch failure', async () => {
    vi.spyOn(weatherApi, 'fetchWeather').mockRejectedValue(new Error('net fail'))
    const { result } = renderHook(() => useWeather(51.5, -0.1))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toMatch(/weather/)
    expect(result.current.data).toBeNull()
  })

  it('skips fetch when lat/lon are null', () => {
    const spy = vi.spyOn(weatherApi, 'fetchWeather')
    renderHook(() => useWeather(null, null))
    expect(spy).not.toHaveBeenCalled()
  })
})
```

```typescript
// tests/hooks/useCalendar.test.ts
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
```

```typescript
// tests/hooks/useTasks.test.ts
import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTasks } from '../../src/hooks/useTasks'
import * as tasksApi from '../../src/api/tasks'

describe('useTasks', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('fetches tasks when token present', async () => {
    const mockTasks = [{ id: 't1', title: 'Buy milk', status: 'needsAction' as const }]
    vi.spyOn(tasksApi, 'fetchTasks').mockResolvedValue({ tasks: mockTasks, listId: 'list1' })

    const { result } = renderHook(() => useTasks('valid-token'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tasks).toEqual(mockTasks)
  })

  it('optimistically marks task complete', async () => {
    const mockTasks = [{ id: 't1', title: 'Buy milk', status: 'needsAction' as const }]
    vi.spyOn(tasksApi, 'fetchTasks').mockResolvedValue({ tasks: mockTasks, listId: 'list1' })
    vi.spyOn(tasksApi, 'completeTask').mockResolvedValue(undefined)

    const { result } = renderHook(() => useTasks('valid-token'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.markComplete('t1') })
    expect(result.current.tasks[0].status).toBe('completed')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/hooks/
```
Expected: FAIL — hooks not found.

- [ ] **Step 3: Implement src/hooks/useWeather.ts**

```typescript
import { useState, useEffect } from 'react'
import { fetchWeather } from '../api/weather'
import type { WeatherData } from '../types/weather'

const POLL_MS = 5 * 60 * 1000

export function useWeather(lat: number | null, lon: number | null) {
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(lat !== null && lon !== null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (lat === null || lon === null) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const d = await fetchWeather(lat!, lon!)
        if (!cancelled) { setData(d); setError(null) }
      } catch {
        if (!cancelled) setError("Couldn't load weather. Retrying…")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const id = setInterval(load, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [lat, lon])

  return { data, loading, error }
}
```

- [ ] **Step 4: Implement src/hooks/useCalendar.ts**

```typescript
import { useState, useEffect } from 'react'
import { fetchTodayEvents } from '../api/calendar'
import type { CalendarEvent } from '../types/google'

const POLL_MS = 5 * 60 * 1000

export function useCalendar(accessToken: string | null) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(accessToken !== null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const data = await fetchTodayEvents(accessToken!)
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
  }, [accessToken])

  return { events, loading, error }
}
```

- [ ] **Step 5: Implement src/hooks/useTasks.ts**

```typescript
import { useState, useEffect, useCallback } from 'react'
import { fetchTasks, completeTask } from '../api/tasks'
import type { Task } from '../types/google'

const POLL_MS = 5 * 60 * 1000

export function useTasks(accessToken: string | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [listId, setListId] = useState<string>('')
  const [loading, setLoading] = useState(accessToken !== null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const result = await fetchTasks(accessToken!)
        if (!cancelled) {
          setTasks(result.tasks)
          setListId(result.listId)
          setError(null)
        }
      } catch {
        if (!cancelled) setError("Couldn't load tasks. Retrying…")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const id = setInterval(load, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [accessToken])

  const markComplete = useCallback(async (taskId: string) => {
    // Optimistic update
    setTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, status: 'completed' as const } : t)
    )
    try {
      await completeTask(accessToken!, listId, taskId)
    } catch {
      // Revert on failure
      setTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, status: 'needsAction' as const } : t)
      )
    }
  }, [accessToken, listId])

  return { tasks, loading, error, markComplete }
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test -- tests/hooks/
```
Expected: all 7 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useWeather.ts src/hooks/useCalendar.ts src/hooks/useTasks.ts tests/hooks/
git commit -m "feat: data hooks — useWeather, useCalendar, useTasks with polling and error states"
```

---

## Task 11: ClockWidget & DateWidget

**Files:**
- Create: `src/components/LeftPanel/ClockWidget.tsx`
- Create: `src/components/LeftPanel/DateWidget.tsx`
- Create: `tests/components/ClockWidget.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// tests/components/ClockWidget.test.tsx
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ClockWidget } from '../../src/components/LeftPanel/ClockWidget'

describe('ClockWidget', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('displays time in HH:MM format', () => {
    vi.setSystemTime(new Date('2026-04-17T09:05:00'))
    render(<ClockWidget />)
    expect(screen.getByText('09:05')).toBeInTheDocument()
  })

  it('updates every second', () => {
    vi.setSystemTime(new Date('2026-04-17T09:05:00'))
    render(<ClockWidget />)
    act(() => { vi.advanceTimersByTime(1000) })
    vi.setSystemTime(new Date('2026-04-17T09:05:01'))
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.getByText('09:05')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/components/ClockWidget.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Implement ClockWidget**

```tsx
// src/components/LeftPanel/ClockWidget.tsx
import { useState, useEffect } from 'react'

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function ClockWidget() {
  const [time, setTime] = useState(() => formatTime(new Date()))

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <div style={{ fontSize: '96px', fontWeight: 300, lineHeight: 1, letterSpacing: '-2px' }}>
        {time}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implement DateWidget**

```tsx
// src/components/LeftPanel/DateWidget.tsx
export function DateWidget() {
  const now = new Date()
  const day = now.toLocaleDateString('en-GB', { weekday: 'long' })
  const date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ textAlign: 'center', paddingBottom: '24px' }}>
      <div style={{ fontSize: '28px', fontWeight: 500, color: 'var(--text-primary)' }}>{day}</div>
      <div style={{ fontSize: '18px', color: 'var(--text-secondary)', marginTop: '4px' }}>{date}</div>
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- tests/components/ClockWidget.test.tsx
```
Expected: 2 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/LeftPanel/ClockWidget.tsx src/components/LeftPanel/DateWidget.tsx tests/components/ClockWidget.test.tsx
git commit -m "feat: ClockWidget (live, 1s tick) and DateWidget"
```

---

## Task 12: WeatherWidget Components

**Files:**
- Create: `src/components/LeftPanel/CurrentWeather.tsx`
- Create: `src/components/LeftPanel/MinMax.tsx`
- Create: `src/components/LeftPanel/HourlyStrip.tsx`
- Create: `src/components/LeftPanel/WeatherWidget.tsx`
- Create: `tests/components/HourlyStrip.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// tests/components/HourlyStrip.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HourlyStrip } from '../../src/components/LeftPanel/HourlyStrip'
import type { HourlySlot } from '../../src/types/weather'

const slots: HourlySlot[] = [
  { time: '2026-04-17T10:00', temp: 17, weatherCode: 0 },
  { time: '2026-04-17T11:00', temp: 18, weatherCode: 1 },
]

describe('HourlyStrip', () => {
  it('renders each slot with temp and hour', () => {
    render(<HourlyStrip slots={slots} />)
    expect(screen.getByText('17°')).toBeInTheDocument()
    expect(screen.getByText('18°')).toBeInTheDocument()
    expect(screen.getByText('10:00')).toBeInTheDocument()
    expect(screen.getByText('11:00')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/components/HourlyStrip.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Implement CurrentWeather**

```tsx
// src/components/LeftPanel/CurrentWeather.tsx
interface Props {
  temp: number
  condition: string
}

const WMO_EMOJI: Record<number, string> = {
  0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️',
  45: '🌫', 48: '🌫',
  51: '🌦', 53: '🌦', 55: '🌧',
  61: '🌧', 63: '🌧', 65: '🌧',
  71: '🌨', 73: '🌨', 75: '❄️',
  80: '🌦', 81: '🌦', 82: '⛈',
  95: '⛈', 96: '⛈', 99: '⛈',
}

export function weatherEmoji(code: number): string {
  return WMO_EMOJI[code] ?? '🌡'
}

export function CurrentWeather({ temp, condition, weatherCode }: Props & { weatherCode: number }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: '48px' }}>{weatherEmoji(weatherCode)}</div>
      <div style={{ fontSize: '48px', fontWeight: 300, lineHeight: 1 }}>{temp}°</div>
      <div style={{ fontSize: '18px', color: 'var(--text-secondary)', marginTop: '4px' }}>{condition}</div>
    </div>
  )
}
```

- [ ] **Step 4: Implement MinMax**

```tsx
// src/components/LeftPanel/MinMax.tsx
interface Props { min: number; max: number }

export function MinMax({ min, max }: Props) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', padding: '4px 0 12px' }}>
      <span style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>↓ {min}°</span>
      <span style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>↑ {max}°</span>
    </div>
  )
}
```

- [ ] **Step 5: Implement HourlyStrip**

```tsx
// src/components/LeftPanel/HourlyStrip.tsx
import type { HourlySlot } from '../../types/weather'
import { weatherEmoji } from './CurrentWeather'

interface Props { slots: HourlySlot[] }

export function HourlyStrip({ slots }: Props) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-around',
      padding: '12px 0',
      borderTop: '1px solid rgba(0,0,0,0.08)',
      marginTop: '8px',
    }}>
      {slots.map(slot => (
        <div key={slot.time} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {slot.time.slice(11, 16)}
          </span>
          <span style={{ fontSize: '20px' }}>{weatherEmoji(slot.weatherCode)}</span>
          <span style={{ fontSize: '15px', fontWeight: 500 }}>{slot.temp}°</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Implement WeatherWidget**

```tsx
// src/components/LeftPanel/WeatherWidget.tsx
import type { WeatherData } from '../../types/weather'
import { CurrentWeather } from './CurrentWeather'
import { MinMax } from './MinMax'
import { HourlyStrip } from './HourlyStrip'

interface Props {
  data: WeatherData | null
  loading: boolean
  error: string | null
}

export function WeatherWidget({ data, loading, error }: Props) {
  if (loading) return <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Loading weather…</div>
  if (error) return <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px', fontSize: '15px' }}>{error}</div>
  if (!data) return null

  return (
    <div>
      <CurrentWeather temp={data.current.temp} condition={data.current.condition} weatherCode={data.current.weatherCode} />
      <MinMax min={data.today.min} max={data.today.max} />
      <HourlyStrip slots={data.hourly} />
    </div>
  )
}
```

- [ ] **Step 7: Run test to verify it passes**

```bash
npm test -- tests/components/HourlyStrip.test.tsx
```
Expected: 1 test passes.

- [ ] **Step 8: Commit**

```bash
git add src/components/LeftPanel/ tests/components/HourlyStrip.test.tsx
git commit -m "feat: WeatherWidget — CurrentWeather, MinMax, HourlyStrip"
```

---

## Task 13: EventCard & CalendarWidget

**Files:**
- Create: `src/components/CenterPanel/EventCard.tsx`
- Create: `src/components/CenterPanel/CalendarWidget.tsx`
- Create: `src/components/CenterPanel/CenterPanel.tsx`
- Create: `tests/components/EventCard.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// tests/components/EventCard.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EventCard } from '../../src/components/CenterPanel/EventCard'
import type { CalendarEvent } from '../../src/types/google'

const event: CalendarEvent = {
  id: 'e1',
  summary: 'Team standup',
  start: { dateTime: '2026-04-17T09:00:00' },
  end: { dateTime: '2026-04-17T09:30:00' },
}

describe('EventCard', () => {
  it('renders event summary', () => {
    render(<EventCard event={event} />)
    expect(screen.getByText('Team standup')).toBeInTheDocument()
  })

  it('renders start time', () => {
    render(<EventCard event={event} />)
    expect(screen.getByText('09:00')).toBeInTheDocument()
  })

  it('renders all-day label for date-only events', () => {
    const allDay: CalendarEvent = { ...event, start: { date: '2026-04-17' }, end: { date: '2026-04-18' } }
    render(<EventCard event={allDay} />)
    expect(screen.getByText('All day')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/components/EventCard.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Implement EventCard**

```tsx
// src/components/CenterPanel/EventCard.tsx
import type { CalendarEvent } from '../../types/google'

interface Props { event: CalendarEvent }

const CALENDAR_COLORS: Record<string, string> = {
  '1': '#A4BDFC', '2': '#7AE7BF', '3': '#DBADFF', '4': '#FF887C',
  '5': '#FBD75B', '6': '#FFB878', '7': '#46D6DB', '8': '#E1E1E1',
  '9': '#5484ED', '10': '#51B749', '11': '#DC2127',
}

function formatEventTime(dt: string): string {
  return dt.slice(11, 16)
}

export function EventCard({ event }: Props) {
  const isAllDay = !event.start.dateTime
  const startTime = isAllDay ? 'All day' : formatEventTime(event.start.dateTime!)
  const accentColor = event.colorId ? CALENDAR_COLORS[event.colorId] : '#A4BDFC'

  return (
    <div style={{
      background: 'var(--card-bg)',
      borderRadius: 'var(--card-radius)',
      boxShadow: 'var(--card-shadow)',
      padding: '14px 16px',
      marginBottom: '10px',
      borderLeft: `4px solid ${accentColor}`,
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
    }}>
      <span style={{ fontSize: '15px', color: 'var(--text-secondary)', minWidth: '48px', paddingTop: '2px' }}>
        {startTime}
      </span>
      <span style={{ fontSize: '20px', fontWeight: 500 }}>{event.summary}</span>
    </div>
  )
}
```

- [ ] **Step 4: Implement CalendarWidget**

```tsx
// src/components/CenterPanel/CalendarWidget.tsx
import type { CalendarEvent } from '../../types/google'
import { EventCard } from './EventCard'

interface Props {
  events: CalendarEvent[]
  loading: boolean
  error: string | null
}

export function CalendarWidget({ events, loading, error }: Props) {
  if (loading) return <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Loading events…</div>
  if (error) return <div style={{ color: 'var(--text-secondary)', padding: '20px', fontSize: '15px' }}>{error}</div>
  if (events.length === 0) return (
    <div style={{ color: 'var(--text-secondary)', padding: '20px', fontSize: '18px', textAlign: 'center' }}>
      No events today
    </div>
  )

  return (
    <div>
      {events.map(event => <EventCard key={event.id} event={event} />)}
    </div>
  )
}
```

- [ ] **Step 5: Implement CenterPanel**

```tsx
// src/components/CenterPanel/CenterPanel.tsx
import type { CalendarEvent } from '../../types/google'
import { CalendarWidget } from './CalendarWidget'

interface Props {
  events: CalendarEvent[]
  loading: boolean
  error: string | null
}

export function CenterPanel({ events, loading, error }: Props) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-secondary)' }}>
        {today}
      </h2>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <CalendarWidget events={events} loading={loading} error={error} />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npm test -- tests/components/EventCard.test.tsx
```
Expected: 3 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/CenterPanel/ tests/components/EventCard.test.tsx
git commit -m "feat: EventCard, CalendarWidget, CenterPanel"
```

---

## Task 14: TaskCard & TasksWidget

**Files:**
- Create: `src/components/RightPanel/TaskCard.tsx`
- Create: `src/components/RightPanel/TasksWidget.tsx`
- Create: `src/components/RightPanel/RightPanel.tsx`
- Create: `tests/components/TaskCard.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// tests/components/TaskCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TaskCard } from '../../src/components/RightPanel/TaskCard'
import type { Task } from '../../src/types/google'

const pendingTask: Task = { id: 't1', title: 'Buy milk', status: 'needsAction' }
const completedTask: Task = { id: 't2', title: 'Read book', status: 'completed' }

describe('TaskCard', () => {
  it('renders task title', () => {
    render(<TaskCard task={pendingTask} onComplete={vi.fn()} />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('calls onComplete when checkbox tapped', () => {
    const onComplete = vi.fn()
    render(<TaskCard task={pendingTask} onComplete={onComplete} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onComplete).toHaveBeenCalledWith('t1')
  })

  it('shows strikethrough for completed tasks', () => {
    render(<TaskCard task={completedTask} onComplete={vi.fn()} />)
    const title = screen.getByText('Read book')
    expect(title).toHaveStyle('text-decoration: line-through')
  })

  it('does not call onComplete for already-completed tasks', () => {
    const onComplete = vi.fn()
    render(<TaskCard task={completedTask} onComplete={onComplete} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onComplete).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/components/TaskCard.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Implement TaskCard**

```tsx
// src/components/RightPanel/TaskCard.tsx
import type { Task } from '../../types/google'

interface Props {
  task: Task
  onComplete: (id: string) => void
}

export function TaskCard({ task, onComplete }: Props) {
  const isComplete = task.status === 'completed'

  return (
    <div style={{
      background: 'var(--card-bg)',
      borderRadius: 'var(--card-radius)',
      boxShadow: 'var(--card-shadow)',
      padding: '14px 16px',
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      opacity: isComplete ? 0.6 : 1,
    }}>
      <input
        type="checkbox"
        role="checkbox"
        checked={isComplete}
        onChange={() => { if (!isComplete) onComplete(task.id) }}
        style={{ width: '22px', height: '22px', cursor: isComplete ? 'default' : 'pointer', accentColor: '#7A7A8A' }}
      />
      <span style={{
        fontSize: '20px',
        textDecoration: isComplete ? 'line-through' : 'none',
        color: isComplete ? 'var(--text-secondary)' : 'var(--text-primary)',
      }}>
        {task.title}
      </span>
    </div>
  )
}
```

- [ ] **Step 4: Implement TasksWidget**

```tsx
// src/components/RightPanel/TasksWidget.tsx
import type { Task } from '../../types/google'
import { TaskCard } from './TaskCard'

interface Props {
  tasks: Task[]
  loading: boolean
  error: string | null
  onComplete: (id: string) => void
}

export function TasksWidget({ tasks, loading, error, onComplete }: Props) {
  if (loading) return <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Loading tasks…</div>
  if (error) return <div style={{ color: 'var(--text-secondary)', padding: '20px', fontSize: '15px' }}>{error}</div>
  if (tasks.length === 0) return (
    <div style={{ color: 'var(--text-secondary)', padding: '20px', fontSize: '18px', textAlign: 'center' }}>
      No tasks
    </div>
  )

  const pending = tasks.filter(t => t.status === 'needsAction')
  const completed = tasks.filter(t => t.status === 'completed')

  return (
    <div>
      {pending.map(t => <TaskCard key={t.id} task={t} onComplete={onComplete} />)}
      {completed.length > 0 && (
        <>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '16px 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Done
          </div>
          {completed.map(t => <TaskCard key={t.id} task={t} onComplete={onComplete} />)}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Implement RightPanel**

```tsx
// src/components/RightPanel/RightPanel.tsx
import type { Task } from '../../types/google'
import { TasksWidget } from './TasksWidget'

interface Props {
  tasks: Task[]
  loading: boolean
  error: string | null
  onComplete: (id: string) => void
}

export function RightPanel({ tasks, loading, error, onComplete }: Props) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-secondary)' }}>
        Tasks
      </h2>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <TasksWidget tasks={tasks} loading={loading} error={error} onComplete={onComplete} />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npm test -- tests/components/TaskCard.test.tsx
```
Expected: 4 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/RightPanel/ tests/components/TaskCard.test.tsx
git commit -m "feat: TaskCard (tappable, optimistic), TasksWidget, RightPanel"
```

---

## Task 15: LeftPanel & Wire Up App.tsx

**Files:**
- Create: `src/components/LeftPanel/LeftPanel.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement LeftPanel**

```tsx
// src/components/LeftPanel/LeftPanel.tsx
import { ClockWidget } from './ClockWidget'
import { DateWidget } from './DateWidget'
import { WeatherWidget } from './WeatherWidget'
import type { WeatherData } from '../../types/weather'

interface Props {
  weather: WeatherData | null
  weatherLoading: boolean
  weatherError: string | null
}

export function LeftPanel({ weather, weatherLoading, weatherError }: Props) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ClockWidget />
      <DateWidget />
      <div style={{ flex: 1 }}>
        <WeatherWidget data={weather} loading={weatherLoading} error={weatherError} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace App.tsx with full wired-up layout**

```tsx
// src/App.tsx
import { useGoogleAuth } from './hooks/useGoogleAuth'
import { useLocation } from './hooks/useLocation'
import { useWeather } from './hooks/useWeather'
import { useCalendar } from './hooks/useCalendar'
import { useTasks } from './hooks/useTasks'
import { LeftPanel } from './components/LeftPanel/LeftPanel'
import { CenterPanel } from './components/CenterPanel/CenterPanel'
import { RightPanel } from './components/RightPanel/RightPanel'

export default function App() {
  const auth = useGoogleAuth()
  const { lat, lon } = useLocation()
  const weather = useWeather(lat, lon)
  const calendar = useCalendar(auth.accessToken)
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

  return (
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
        <RightPanel tasks={tasks.tasks} loading={tasks.loading} error={tasks.error} onComplete={tasks.markComplete} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```
Expected: all tests pass with no errors.

- [ ] **Step 4: Start dev server and verify UI in browser**

```bash
npm run dev
```
Open http://localhost:5173. Expected: Sign-in screen with "Morning Dashboard" heading and Google sign-in button on pastel background.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/LeftPanel/LeftPanel.tsx
git commit -m "feat: wire up App.tsx — LeftPanel, auth gate, full three-column layout"
```

---

## Task 16: Google Cloud Setup & .env

**Files:**
- Create: `.env` (not committed — user creates this)
- Create: `SETUP.md`

- [ ] **Step 1: Create SETUP.md with Google Cloud instructions**

```markdown
# Setup

## 1. Create a Google Cloud Project

1. Go to https://console.cloud.google.com
2. Create a new project (e.g., "Morning Dashboard")

## 2. Enable APIs

In the project, go to **APIs & Services > Library** and enable:
- Google Calendar API
- Tasks API

## 3. Configure OAuth Consent Screen

Go to **APIs & Services > OAuth consent screen**:
- User type: External (or Internal if using Workspace)
- Add scopes: `calendar.readonly` and `tasks`
- Add your Google account as a test user

## 4. Create OAuth Client ID

Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**:
- Application type: **Web application**
- Authorized JavaScript origins: `http://localhost:5173`
- Download the JSON — copy the **Client ID**

For Android (when deploying):
- Create a second credential: **Android**
- Package name: `com.personal.morningdashboard`
- SHA-1: run `keytool -keystore ~/.android/debug.keystore -list -v` and copy the SHA-1

## 5. Create .env file

```
cp .env.example .env
```

Edit `.env` and paste your Web client ID:
```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

## 6. Run

```bash
npm run dev
```

Open http://localhost:5173, click "Sign in with Google".
```

- [ ] **Step 2: Add .env to .gitignore**

```bash
echo '.env' >> .gitignore
git add .gitignore SETUP.md
git commit -m "docs: Google Cloud setup guide and .gitignore for .env"
```

---

## Task 17: Android APK Build

**Files:**
- Modify: `capacitor.config.ts` (already exists)

- [ ] **Step 1: Build web assets**

```bash
npm run build
```
Expected: `dist/` folder created.

- [ ] **Step 2: Sync with Capacitor**

```bash
npx cap sync android
```
Expected: Android project updated with latest web build.

- [ ] **Step 3: Open Android Studio**

```bash
npx cap open android
```
Expected: Android Studio opens the `android/` project.

- [ ] **Step 4: Build and run on device/emulator**

In Android Studio:
- Select your device or emulator from the toolbar
- Click the green Run ▶ button
- Expected: App installs and shows the sign-in screen

- [ ] **Step 5: Verify full flow on device**

- Tap "Sign in with Google" → OAuth consent → dashboard appears
- Clock ticks every second
- Calendar events load
- Tasks load; tap a checkbox → task moves to "Done" section
- Weather loads with current conditions

- [ ] **Step 6: Commit**

```bash
git add android/
git commit -m "chore: Capacitor Android project sync"
```

---

## Full Test Run

After all tasks are complete:

```bash
npm test
```
Expected output: all test suites pass.

```
✓ tests/api/weather.test.ts (5)
✓ tests/api/calendar.test.ts (3)
✓ tests/api/tasks.test.ts (3)
✓ tests/hooks/useWeather.test.ts (3)
✓ tests/hooks/useCalendar.test.ts (2)
✓ tests/hooks/useTasks.test.ts (2)
✓ tests/components/ClockWidget.test.tsx (2)
✓ tests/components/EventCard.test.tsx (3)
✓ tests/components/TaskCard.test.tsx (4)
✓ tests/components/HourlyStrip.test.tsx (1)

Test Files: 10 passed
Tests: 28 passed
```
