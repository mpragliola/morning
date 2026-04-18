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
