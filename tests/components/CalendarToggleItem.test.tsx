import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CalendarToggleItem } from '../../src/components/PreferencesScreen/CalendarToggleItem'
import type { CalendarMeta } from '../../src/types/google'

const cal: CalendarMeta = {
  id: 'cal1',
  summary: 'Work',
  backgroundColor: '#0F9D58',
  foregroundColor: '#ffffff',
}

describe('CalendarToggleItem', () => {
  it('renders calendar name', () => {
    render(<CalendarToggleItem calendar={cal} hidden={false} onToggle={vi.fn()} />)
    expect(screen.getByText('Work')).toBeInTheDocument()
  })

  it('shows checkbox checked when not hidden', () => {
    render(<CalendarToggleItem calendar={cal} hidden={false} onToggle={vi.fn()} />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('shows checkbox unchecked when hidden', () => {
    render(<CalendarToggleItem calendar={cal} hidden={true} onToggle={vi.fn()} />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('calls onToggle with calendar id when clicked', () => {
    const onToggle = vi.fn()
    render(<CalendarToggleItem calendar={cal} hidden={false} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('cal1')
  })
})
