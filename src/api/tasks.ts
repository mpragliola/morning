import type { Task } from '../types/google'
import { googleFetch } from './google'

// Fetches tasks from the user's default (first) task list.
export async function fetchTasks(accessToken: string): Promise<{ tasks: Task[]; listId: string }> {
  const listsRes = await googleFetch(
    'https://www.googleapis.com/tasks/v1/users/@me/lists?maxResults=1',
    accessToken
  )
  const listsData = await listsRes.json()
  const lists = listsData.items ?? []
  if (lists.length === 0) return { tasks: [], listId: '' }

  const listId: string = lists[0].id

  const tasksRes = await googleFetch(
    `https://www.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=true&maxResults=30`,
    accessToken
  )
  const tasksData = await tasksRes.json()
  return { tasks: (tasksData.items ?? []) as Task[], listId }
}

export async function completeTask(
  accessToken: string,
  listId: string,
  taskId: string
): Promise<void> {
  await googleFetch(
    `https://www.googleapis.com/tasks/v1/lists/${listId}/tasks/${taskId}`,
    accessToken,
    {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    }
  )
}
