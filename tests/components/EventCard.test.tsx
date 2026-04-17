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
