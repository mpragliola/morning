// src/components/RightPanel/RightPanel.tsx
import type { Task } from '../../types/google'
import { TasksWidget } from './TasksWidget'

interface Props {
  tasks: Task[]
  loading: boolean
  error: string | null
  onComplete: (id: string) => void
}

export function RightPanel({ tasks, loading, error, onComplete }: Props) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-secondary)' }}>
        Tasks
      </h2>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <TasksWidget tasks={tasks} loading={loading} error={error} onComplete={onComplete} />
      </div>
    </div>
  )
}
