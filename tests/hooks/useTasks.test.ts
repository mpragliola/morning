import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTasks } from '../../src/hooks/useTasks'
import * as tasksApi from '../../src/api/tasks'

describe('useTasks', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('fetches tasks when token present', async () => {
    const mockTasks = [{ id: 't1', title: 'Buy milk', status: 'needsAction' as const }]
    vi.spyOn(tasksApi, 'fetchTasks').mockResolvedValue({ tasks: mockTasks, listId: 'list1' })

    const { result } = renderHook(() => useTasks('valid-token'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tasks).toEqual(mockTasks)
  })

  it('optimistically marks task complete', async () => {
    const mockTasks = [{ id: 't1', title: 'Buy milk', status: 'needsAction' as const }]
    vi.spyOn(tasksApi, 'fetchTasks').mockResolvedValue({ tasks: mockTasks, listId: 'list1' })
    vi.spyOn(tasksApi, 'completeTask').mockResolvedValue(undefined)

    const { result } = renderHook(() => useTasks('valid-token'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.toggleTask('t1', 'needsAction') })
    expect(result.current.tasks[0].status).toBe('completed')
  })
})
