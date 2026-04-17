# Morning Dashboard — Design Spec
_Date: 2026-04-17_

## Overview

A personal kiosk app displayed on a 10" landscape tablet. Shows today's calendar events, current time, weather forecast, and Google Tasks on a single screen. Elegant, minimalistic, pastel-colored UI with large fonts readable at arm's length.

Developed on Ubuntu (browser), deployed as an Android APK via Capacitor.

---

## Stack

| Layer | Technology |
|---|---|
| UI framework | React 18 + TypeScript |
| Build tool | Vite |
| Native packaging | Capacitor 6 |
| Auth | `@codetrix-studio/capacitor-google-auth` (OAuth2) |
| Secure storage | Capacitor Preferences |
| Weather API | Open-Meteo (no key required) |
| Calendar API | Google Calendar REST API v3 |
| Tasks API | Google Tasks REST API v1 |

No backend. All API calls are made directly from the app.

---

## Layout

Single screen, three-column layout, landscape orientation.

```
┌─────────────────┬──────────────────────┬─────────────────┐
│   LEFT          │   CENTER             │   RIGHT         │
│                 │                      │                 │
│  Clock          │  Calendar            │  Tasks          │
│  HH:MM          │  Today's events      │  Task list      │
│  Day, Date      │  (scrollable)        │  (scrollable)   │
│                 │                      │                 │
│  Weather        │                      │                 │
│  Current temp   │                      │                 │
│  Condition      │                      │                 │
│  Min / Max      │                      │                 │
│  Hourly strip   │                      │                 │
└─────────────────┴──────────────────────┴─────────────────┘
```

Columns are full-height. Left panel is narrower (~28%), center takes the most space (~44%), right is equal to left (~28%).

---

## Visual Design

### Palette

| Role | Color |
|---|---|
| Page background | `#1E1E2E` (deep muted navy) |
| Left panel | `#252538` (slightly lighter navy-blue) |
| Center panel | `#26263A` (muted navy-purple) |
| Right panel | `#243328` (muted dark green) |
| Primary text | `#E8E4F0` (soft off-white) |
| Secondary text | `#9A96AA` (muted lavender-grey) |
| Card background | `rgba(255,255,255,0.07)` |
| Card shadow | `rgba(0,0,0,0.25)` |

### Typography

| Element | Size |
|---|---|
| Clock (HH:MM) | ~96px, light weight |
| Date line | ~28px |
| Weather temp | ~48px |
| Event / task titles | ~22–20px |
| Secondary labels | ~15px |

Font: system-ui or Inter (clean, no-nonsense sans-serif).

### Cards

Rounded corners (12px), soft drop shadow, no hard borders. Each calendar event and task is its own card.

---

## Components

```
App
├── useGoogleAuth()        — OAuth2 token lifecycle, refresh on expiry
├── useCalendar()          — today's events, polling every 5 min
├── useTasks()             — task list, polling every 5 min
├── useWeather()           — Open-Meteo data, polling every 5 min
│
├── LeftPanel
│   ├── ClockWidget        — live clock, updates every second
│   ├── DateWidget         — day name + full date
│   └── WeatherWidget
│       ├── CurrentWeather — icon, temperature, condition label
│       ├── MinMax         — today's low / high
│       └── HourlyStrip    — 5 upcoming hourly slots (icon + temp)
│
├── CenterPanel
│   └── CalendarWidget
│       └── EventCard[]    — start time + title; color-coded by Google Calendar color
│
└── RightPanel
    └── TasksWidget
        └── TaskCard[]     — tappable checkbox + title; tapping marks task complete via Google Tasks API, completed tasks shown with strikethrough
```

---

## Data & Refresh

- **Clock:** `setInterval` every 1 second, pure local state.
- **Calendar / Tasks / Weather:** each hook polls independently every 5 minutes via `setInterval`.
- **Location:** acquired once on load via `navigator.geolocation`, stored in Capacitor Preferences. Used to initialize Open-Meteo coordinates.
- **Auth tokens:** stored in Capacitor Preferences. Refreshed automatically before expiry.

---

## Error Handling

- Each widget handles its own error state independently — a failed weather fetch does not affect calendar rendering.
- Error state shows a soft inline message, e.g. "Couldn't load events. Retrying…"
- Auth failure shows a re-login button in the affected widget.
- No global error boundary that hides the whole screen.

---

## Google OAuth Setup

The user must create a Google Cloud project, enable Calendar API and Tasks API, and configure an OAuth2 client ID (Android + Web). The client ID is stored in the app config (not committed). First run triggers the OAuth consent flow; subsequent runs use stored tokens.

---

## Development Workflow

1. `npm run dev` — runs Vite dev server, open in browser on Ubuntu for UI work.
2. `npx cap sync android` — syncs web build into Capacitor Android project.
3. `npx cap open android` — opens Android Studio to build/sign APK.
4. Deploy APK to tablet via ADB or manual install.

---

## Out of Scope

- Push notifications
- Task creation or editing (title/due date changes)
- Multi-day calendar view
- Settings UI (config via env/config file only)
- Backend or cloud sync
