# Tomorrow's Event Preview — Design Spec

**Date:** 2026-04-18

## Overview

Add a compact, fixed-height preview of the next day's events to the bottom of the center panel, below today's event list. The preview is always visible, never scrollable, and visually subordinate to today's events.

## Layout

The center panel (`CenterPanel.tsx`) is restructured into three vertical sections using flex column layout:

1. **Date header** — today's date, unchanged (`flex-shrink: 0`)
2. **Today's events** — `flex: 1; overflow: hidden; min-height: 0` — fills remaining space, clips if too many events
3. **Tomorrow's preview** — `flex-shrink: 0; height: ~18%` — fixed slice pinned at the bottom

No scroll anywhere. `overflowY: auto` is removed from any panel wrappers that currently have it.

## Tomorrow Preview Section

### Label
Small uppercase text: `"Tomorrow · {weekday} {day} {month}"` (e.g. "Tomorrow · Sat 19 Apr").  
Color: `var(--text-secondary)` at ~40% opacity. Font size: small (e.g. 13px). Margin below: 6px.

### Event rows
Each event renders as a compact row: `time — title`. No location, no description, no duration, no color accent bar.

- Time: small, dimmed (e.g. 11px, `var(--text-secondary)` at ~50% opacity)
- Title: medium (e.g. 14px), dimmed (`var(--text-secondary)` at ~60% opacity)
- Background: `var(--card-bg)` with `opacity: 0.5` on the row (consistent with how past events are dimmed at 35% in `EventCard`)
- Border radius matching existing cards
- As many rows as fit within the 18% height — overflow hidden, no indicator

### Empty state
If tomorrow has no events: show nothing (the section simply doesn't render, today's events take all space).

## Data

### New hook: `useTomorrowCalendar`
Mirrors `useCalendar` but fetches the next calendar day's range instead of today. Reuses the same `fetchEventsForCalendar` logic from `src/api/calendar.ts` with a `tomorrowRange()` helper.

- Same polling interval (5 min)
- Same `calendarIds` input (visible calendars)
- Returns `{ events, loading, error }`

### API change: `calendar.ts`
Extract a generic `fetchEventsInRange(accessToken, calendarIds, timeMin, timeMax)` function so both today and tomorrow hooks can call it without duplication. Keep `fetchTodayEvents` as a thin wrapper.

## Components

### `TomorrowPreview.tsx` (new)
Props: `events: CalendarEvent[]`  
Renders the fixed-height section: label + list of compact rows. If `events.length === 0`, returns `null`.

### `CenterPanel.tsx` (modified)
- Receives `tomorrowEvents: CalendarEvent[]` as an additional prop
- Restructures layout to flex column with `TomorrowPreview` at the bottom
- Removes any `overflowY` from today's event container; replaces with `overflow: hidden`

### `App.tsx` (modified)
- Instantiates `useTomorrowCalendar` hook
- Passes `tomorrowEvents` down to `CenterPanel`

## Constraints

- **No scroll** — hard constraint across the entire app
- Today's event list clips silently if there are more events than fit — no truncation indicator
- Tomorrow section occupies exactly ~18% of the panel height regardless of content
- No interaction on tomorrow's rows (no click-to-open modal)

## Out of scope

- Clicking a tomorrow event to open its detail modal
- Showing tomorrow's events count or a "+N more" indicator
- Any day beyond tomorrow
