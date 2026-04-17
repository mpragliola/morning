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
      padding: '18px 20px',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      opacity: isComplete ? 0.6 : 1,
    }}>
      <input
        type="checkbox"
        role="checkbox"
        checked={isComplete}
        onChange={() => onToggle(task.id, task.status)}
        style={{ width: '34px', height: '34px', cursor: 'pointer', accentColor: '#9A96AA', flexShrink: 0 }}
      />
      <span style={{
        fontSize: '42px',
        lineHeight: 1.25,
        textDecoration: isComplete ? 'line-through' : 'none',
        color: isComplete ? 'var(--text-secondary)' : 'var(--text-primary)',
      }}>
        {task.title}
      </span>
    </div>
  )
}
