import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchTasks, completeTask } from '../../src/api/tasks'

describe('fetchTasks', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('returns tasks from default task list', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [{ id: 'list1', title: 'My Tasks' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            { id: 'task1', title: 'Buy milk', status: 'needsAction' },
            { id: 'task2', title: 'Read book', status: 'completed' },
          ],
        }),
      })
    )

    const result = await fetchTasks('fake-token')
    expect(result.tasks).toHaveLength(2)
    expect(result.tasks[0].id).toBe('task1')
    expect(result.tasks[0].status).toBe('needsAction')
    expect(result.tasks[1].status).toBe('completed')
    expect(result.listId).toBe('list1')
  })

  it('returns empty tasks and empty listId when no task lists', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    }))
    const result = await fetchTasks('fake-token')
    expect(result.tasks).toEqual([])
    expect(result.listId).toBe('')
  })
})

describe('completeTask', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('sends PATCH with completed status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'task1', status: 'completed' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await completeTask('fake-token', 'list1', 'task1')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/lists/list1/tasks/task1'),
      expect.objectContaining({ method: 'PATCH' })
    )
  })
})
