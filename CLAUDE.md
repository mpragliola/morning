# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start Vite dev server
npm run build        # tsc + vite build
npm run lint         # ESLint
npm run test         # Vitest (unit, run once)
npm run test:watch   # Vitest (watch mode)
npm run test:e2e     # Playwright e2e tests
npm run test:e2e:ui  # Playwright with interactive UI
npm run screenshot   # capture docs screenshot via e2e/screenshot.ts
```

Run a single Vitest test file:
```bash
npx vitest run src/hooks/useCalendar.test.ts
```

## Environment

Copy `.env.example` to `.env` and set `VITE_GOOGLE_CLIENT_ID` to a Google OAuth client ID. Without it, sign-in is disabled.

## Architecture

**Morning Dashboard** — a fullscreen, three-panel React/Vite app showing weather (left), Google Calendar events for today (center), and Google Tasks (right). Designed as a browser dashboard; also ships as an Android app via Capacitor.

### Auth & storage

`useGoogleAuth` manages a Google OAuth 2 token using the GSI (`window.google.accounts.oauth2`) token client loaded from a script tag. Tokens are persisted via `@capacitor/preferences`, which maps to `localStorage` in the browser (keys prefixed `CapacitorStorage.`). Token expiry is stored separately; the hook restores a valid token on load and exposes `signIn` / `signOut`.

### Data flow

Each data domain has a dedicated hook (`useCalendar`, `useTasks`, `useCalendarList`, `useWeather`, `useLocation`, `useLocationName`). Hooks receive `accessToken` as a parameter and fire fetch calls directly against Google REST APIs and Open-Meteo / Nominatim. There is no global state manager — `App.tsx` wires everything together and passes props down.

Calendar visibility is controlled by `useHiddenCalendars` (IDs stored in `@capacitor/preferences`). `useCalendarList` fetches all calendars; `App.tsx` filters out hidden ones before passing `visibleCalendarIds` to `useCalendar`.

### Panels

| Panel | Background var | Content |
|-------|---------------|---------|
| Left (28%) | `--panel-left` | Weather, hourly strip, sun times |
| Center (44%) | `--panel-center` | Today's calendar events |
| Right (28%) | `--panel-right` | Google Tasks checklist |

Preferences (calendar visibility toggle) replace the main layout when `showPrefs` is true.

### Styling

All theming via CSS custom properties in `src/index.css`. No CSS-in-JS library — inline `style` props throughout components.

### Testing

- **Unit tests**: Vitest + Testing Library. Config in `tsconfig.test.json`; setup in `src/test-setup.ts`.
- **E2e tests**: Playwright. `e2e/fixtures.ts` exports an `authenticatedPage` fixture that injects a fake token into `localStorage` and mocks all external APIs (Google Calendar, Google Tasks, Open-Meteo, Nominatim) via `page.route`. Use this fixture for any test that needs the authenticated dashboard.

**Rule: always update the test suite when implementing any feature or fix.** Every new hook gets a unit test. Every new component gets a unit test. Any user-visible behaviour change gets an e2e test. Never mark a task complete without running `npm run test` and `npm run test:e2e`.
