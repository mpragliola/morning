import { render, screen } from '@testing-library/react'
import { EventCard } from './EventCard'
import type { CalendarEvent } from '../../types/google'

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'test-event',
    summary: 'Test Event',
    start: { dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
    end: { dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() },
    ...overrides,
  }
}

function getCard() {
  return screen.getByTestId('event-card')
}

test('future event is not dimmed', () => {
  render(<EventCard event={makeEvent()} />)
  expect(getCard()).toHaveStyle({ opacity: '1' })
})

test('past event is dimmed', () => {
  render(
    <EventCard
      event={makeEvent({
        start: { dateTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
        end: { dateTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
      })}
    />
  )
  expect(getCard()).toHaveStyle({ opacity: '0.35' })
})

test('in-progress event (started but not ended) is not dimmed', () => {
  render(
    <EventCard
      event={makeEvent({
        start: { dateTime: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
        end: { dateTime: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
      })}
    />
  )
  expect(getCard()).toHaveStyle({ opacity: '1' })
})

test('all-day event is never dimmed', () => {
  render(
    <EventCard
      event={{
        id: 'all-day',
        summary: 'Test Event',
        start: { date: '2000-01-01' },
        end: { date: '2000-01-02' },
      }}
    />
  )
  expect(getCard()).toHaveStyle({ opacity: '1' })
})
