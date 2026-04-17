import { useState, useEffect, useCallback } from 'react'
import { fetchTasks, completeTask, uncompleteTask } from '../api/tasks'
import type { Task } from '../types/google'

const POLL_MS = 5 * 60 * 1000

export function useTasks(accessToken: string | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [listId, setListId] = useState<string>('')
  const [loading, setLoading] = useState(accessToken !== null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const result = await fetchTasks(accessToken!)
        if (!cancelled) {
          setTasks(result.tasks)
          setListId(result.listId)
          setError(null)
        }
      } catch {
        if (!cancelled) setError("Couldn't load tasks. Retrying…")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const id = setInterval(load, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [accessToken])

  const toggleTask = useCallback(async (taskId: string, currentStatus: 'needsAction' | 'completed') => {
    const newStatus = currentStatus === 'needsAction' ? 'completed' : 'needsAction'
    setTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    )
    try {
      if (newStatus === 'completed') {
        await completeTask(accessToken!, listId, taskId)
      } else {
        await uncompleteTask(accessToken!, listId, taskId)
      }
    } catch {
      // Revert on failure
      setTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, status: currentStatus } : t)
      )
    }
  }, [accessToken, listId])

  return { tasks, loading, error, toggleTask }
}
