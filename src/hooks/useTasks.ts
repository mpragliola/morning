import { useState, useEffect, useCallback } from 'react'
import { fetchTasks, completeTask } from '../api/tasks'
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

  const markComplete = useCallback(async (taskId: string) => {
    // Optimistic update
    setTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, status: 'completed' as const } : t)
    )
    try {
      await completeTask(accessToken!, listId, taskId)
    } catch {
      // Revert on failure
      setTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, status: 'needsAction' as const } : t)
      )
    }
  }, [accessToken, listId])

  return { tasks, loading, error, markComplete }
}
