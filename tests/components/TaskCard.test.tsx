// tests/components/TaskCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TaskCard } from '../../src/components/RightPanel/TaskCard'
import type { Task } from '../../src/types/google'

const pendingTask: Task = { id: 't1', title: 'Buy milk', status: 'needsAction' }
const completedTask: Task = { id: 't2', title: 'Read book', status: 'completed' }

describe('TaskCard', () => {
  it('renders task title', () => {
    render(<TaskCard task={pendingTask} onComplete={vi.fn()} />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('calls onComplete when checkbox tapped', () => {
    const onComplete = vi.fn()
    render(<TaskCard task={pendingTask} onComplete={onComplete} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onComplete).toHaveBeenCalledWith('t1')
  })

  it('shows strikethrough for completed tasks', () => {
    render(<TaskCard task={completedTask} onComplete={vi.fn()} />)
    const title = screen.getByText('Read book')
    expect(title).toHaveStyle('text-decoration: line-through')
  })

  it('does not call onComplete for already-completed tasks', () => {
    const onComplete = vi.fn()
    render(<TaskCard task={completedTask} onComplete={onComplete} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onComplete).not.toHaveBeenCalled()
  })
})
