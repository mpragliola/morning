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
