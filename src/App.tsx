// src/App.tsx
export default function App() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '28% 44% 28%',
      height: '100vh',
      width: '100vw',
      gap: 0,
    }}>
      <div style={{ background: 'var(--panel-left)', padding: '24px', overflowY: 'auto' }}>
        Left
      </div>
      <div style={{ background: 'var(--panel-center)', padding: '24px', overflowY: 'auto' }}>
        Center
      </div>
      <div style={{ background: 'var(--panel-right)', padding: '24px', overflowY: 'auto' }}>
        Right
      </div>
    </div>
  )
}
