// tests/components/TaskCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TaskCard } from '../../src/components/RightPanel/TaskCard'
import type { Task } from '../../src/types/google'

const pendingTask: Task = { id: 't1', title: 'Buy milk', status: 'needsAction' }
const completedTask: Task = { id: 't2', title: 'Read book', status: 'completed' }

describe('TaskCard', () => {
  it('renders task title', () => {
    render(<TaskCard task={pendingTask} onToggle={vi.fn()} />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('calls onToggle with id and current status when checkbox tapped', () => {
    const onToggle = vi.fn()
    render(<TaskCard task={pendingTask} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('t1', 'needsAction')
  })

  it('shows strikethrough for completed tasks', () => {
    render(<TaskCard task={completedTask} onToggle={vi.fn()} />)
    const title = screen.getByText('Read book')
    expect(title).toHaveStyle('text-decoration: line-through')
  })

  it('calls onToggle for completed tasks to allow unchecking', () => {
    const onToggle = vi.fn()
    render(<TaskCard task={completedTask} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('t2', 'completed')
  })
})
