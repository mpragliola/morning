// tests/components/SunTimes.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SunTimes } from '../../src/components/LeftPanel/SunTimes'

describe('SunTimes', () => {
  it('renders sunrise and sunset times', () => {
    render(<SunTimes sunrise="06:15" sunset="20:30" locationName={null} />)
    expect(screen.getByText(/06:15/)).toBeInTheDocument()
    expect(screen.getByText(/20:30/)).toBeInTheDocument()
  })

  it('shows location name when provided', () => {
    render(<SunTimes sunrise="06:15" sunset="20:30" locationName="Milan" />)
    expect(screen.getByText(/Milan/)).toBeInTheDocument()
  })

  it('hides location when null', () => {
    render(<SunTimes sunrise="06:15" sunset="20:30" locationName={null} />)
    expect(screen.queryByText('📍')).not.toBeInTheDocument()
  })
})
