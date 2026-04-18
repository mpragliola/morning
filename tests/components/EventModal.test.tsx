// tests/components/EventModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { EventModal } from '../../src/components/CenterPanel/EventModal'
import type { CalendarEvent } from '../../src/types/google'

const baseEvent: CalendarEvent = {
  id: 'e1',
  summary: 'Team Standup',
  start: { dateTime: '2026-04-18T09:00:00' },
  end: { dateTime: '2026-04-18T09:30:00' },
}

describe('EventModal', () => {
  it('renders event title', () => {
    render(<EventModal event={baseEvent} accentColor="#A4BDFC" onClose={vi.fn()} />)
    expect(screen.getByText('Team Standup')).toBeInTheDocument()
  })

  it('shows duration label', () => {
    render(<EventModal event={baseEvent} accentColor="#A4BDFC" onClose={vi.fn()} />)
    expect(screen.getByText('30 min')).toBeInTheDocument()
  })

  it('shows location when present', () => {
    const event = { ...baseEvent, location: 'Conference Room A' }
    render(<EventModal event={event} accentColor="#A4BDFC" onClose={vi.fn()} />)
    expect(screen.getByText('Conference Room A')).toBeInTheDocument()
  })

  it('hides location when absent', () => {
    render(<EventModal event={baseEvent} accentColor="#A4BDFC" onClose={vi.fn()} />)
    expect(screen.queryByText('📍')).not.toBeInTheDocument()
  })

  it('shows full description (not truncated)', () => {
    const event = { ...baseEvent, description: 'Line one\nLine two\nLine three' }
    render(<EventModal event={event} accentColor="#A4BDFC" onClose={vi.fn()} />)
    expect(screen.getByText(/Line one/)).toBeInTheDocument()
    expect(screen.getByText(/Line two/)).toBeInTheDocument()
    expect(screen.getByText(/Line three/)).toBeInTheDocument()
  })

  it('strips HTML tags from description', () => {
    const event = { ...baseEvent, description: '<b>Bold</b> text <br/>next line' }
    render(<EventModal event={event} accentColor="#A4BDFC" onClose={vi.fn()} />)
    expect(screen.getByText(/Bold text/)).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<EventModal event={baseEvent} accentColor="#A4BDFC" onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop clicked', () => {
    const onClose = vi.fn()
    const { container } = render(<EventModal event={baseEvent} accentColor="#A4BDFC" onClose={onClose} />)
    fireEvent.click(container.firstChild as Element)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when modal content clicked', () => {
    const onClose = vi.fn()
    render(<EventModal event={baseEvent} accentColor="#A4BDFC" onClose={onClose} />)
    fireEvent.click(screen.getByText('Team Standup'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows All day for all-day events', () => {
    const event: CalendarEvent = { id: 'e2', summary: 'Holiday', start: { date: '2026-04-18' }, end: { date: '2026-04-19' } }
    render(<EventModal event={event} accentColor="#A4BDFC" onClose={vi.fn()} />)
    expect(screen.getByText('All day')).toBeInTheDocument()
  })
})
