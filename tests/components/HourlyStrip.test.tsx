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
    expect(screen.getByText('17')).toBeInTheDocument()
    expect(screen.getByText('18')).toBeInTheDocument()
    expect(screen.getByText('10:00')).toBeInTheDocument()
    expect(screen.getByText('11:00')).toBeInTheDocument()
  })
})
