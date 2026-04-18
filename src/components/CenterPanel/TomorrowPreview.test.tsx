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
  const rows = screen.getAllByTestId('tomorrow-event-row')
  expect(rows).toHaveLength(1)
  const timeSpan = rows[0].querySelector('span')
  expect(timeSpan?.textContent).toMatch(/^\d{2}:\d{2}$/)
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

test('renders All day for all-day events', () => {
  const allDay: CalendarEvent = {
    id: 'e1',
    summary: 'Holiday',
    start: { date: '2026-04-19' },
    end: { date: '2026-04-20' },
  }
  render(<TomorrowPreview events={[allDay]} />)
  expect(screen.getByText('All day')).toBeInTheDocument()
})
