// src/components/RightPanel/TaskCard.tsx
import type { Task } from '../../types/google'

interface Props {
  task: Task
  onToggle: (id: string, status: 'needsAction' | 'completed') => void
}

export function TaskCard({ task, onToggle }: Props) {
  const isComplete = task.status === 'completed'

  return (
    <div style={{
      background: 'var(--card-bg)',
      borderRadius: 'var(--card-radius)',
      boxShadow: 'var(--card-shadow)',
      padding: '14px 16px',
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      opacity: isComplete ? 0.6 : 1,
    }}>
      <input
        type="checkbox"
        role="checkbox"
        checked={isComplete}
        onChange={() => onToggle(task.id, task.status)}
        style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#9A96AA' }}
      />
      <span style={{
        fontSize: '20px',
        textDecoration: isComplete ? 'line-through' : 'none',
        color: isComplete ? 'var(--text-secondary)' : 'var(--text-primary)',
      }}>
        {task.title}
      </span>
    </div>
  )
}
