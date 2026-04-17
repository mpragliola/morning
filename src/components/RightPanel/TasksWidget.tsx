// src/components/RightPanel/TasksWidget.tsx
import type { Task } from '../../types/google'
import { TaskCard } from './TaskCard'

interface Props {
  tasks: Task[]
  loading: boolean
  error: string | null
  onToggle: (id: string, status: 'needsAction' | 'completed') => void
}

export function TasksWidget({ tasks, loading, error, onToggle }: Props) {
  if (loading) return <div style={{ color: 'var(--text-secondary)', padding: '20px', fontSize: '22px' }}>Loading tasks…</div>
  if (error) return <div style={{ color: 'var(--text-secondary)', padding: '20px', fontSize: '22px' }}>{error}</div>
  if (tasks.length === 0) return (
    <div style={{ color: 'var(--text-secondary)', padding: '20px', fontSize: '26px', textAlign: 'center' }}>
      No tasks
    </div>
  )

  const pending = tasks.filter(t => t.status === 'needsAction')
  const completed = tasks.filter(t => t.status === 'completed')

  return (
    <div>
      {pending.map(t => <TaskCard key={t.id} task={t} onToggle={onToggle} />)}
      {completed.length > 0 && (
        <>
          <div style={{ fontSize: '18px', color: 'var(--text-secondary)', margin: '20px 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Done
          </div>
          {completed.map(t => <TaskCard key={t.id} task={t} onToggle={onToggle} />)}
        </>
      )}
    </div>
  )
}
