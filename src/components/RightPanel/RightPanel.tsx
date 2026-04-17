// src/components/RightPanel/RightPanel.tsx
import type { Task } from '../../types/google'
import { TasksWidget } from './TasksWidget'

interface Props {
  tasks: Task[]
  loading: boolean
  error: string | null
  onToggle: (id: string, status: 'needsAction' | 'completed') => void
}

export function RightPanel({ tasks, loading, error, onToggle }: Props) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-secondary)' }}>
        Tasks
      </h2>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <TasksWidget tasks={tasks} loading={loading} error={error} onToggle={onToggle} />
      </div>
    </div>
  )
}
