// src/App.tsx
import { useGoogleAuth } from './hooks/useGoogleAuth'
import { useLocation } from './hooks/useLocation'
import { useWeather } from './hooks/useWeather'
import { useCalendar } from './hooks/useCalendar'
import { useTasks } from './hooks/useTasks'
import { LeftPanel } from './components/LeftPanel/LeftPanel'
import { CenterPanel } from './components/CenterPanel/CenterPanel'
import { RightPanel } from './components/RightPanel/RightPanel'

export default function App() {
  const auth = useGoogleAuth()
  const { lat, lon } = useLocation()
  const weather = useWeather(lat, lon)
  const calendar = useCalendar(auth.accessToken)
  const tasks = useTasks(auth.accessToken)

  if (auth.loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <span style={{ fontSize: '24px', color: 'var(--text-secondary)' }}>Loading…</span>
      </div>
    )
  }

  if (!auth.accessToken) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: '16px' }}>
        <div style={{ fontSize: '28px', color: 'var(--text-primary)' }}>Morning Dashboard</div>
        {auth.error && <div style={{ fontSize: '16px', color: '#E57373' }}>{auth.error}</div>}
        <button
          onClick={auth.signIn}
          style={{
            marginTop: '8px',
            padding: '14px 32px',
            fontSize: '18px',
            borderRadius: '10px',
            border: 'none',
            background: 'var(--panel-left)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          Sign in with Google
        </button>
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '28% 44% 28%',
      height: '100vh',
      width: '100vw',
    }}>
      <div style={{ background: 'var(--panel-left)', padding: '24px', overflowY: 'auto' }}>
        <LeftPanel weather={weather.data} weatherLoading={weather.loading} weatherError={weather.error} />
      </div>
      <div style={{ background: 'var(--panel-center)', padding: '24px', overflowY: 'auto' }}>
        <CenterPanel events={calendar.events} loading={calendar.loading} error={calendar.error} />
      </div>
      <div style={{ background: 'var(--panel-right)', padding: '24px', overflowY: 'auto' }}>
        <RightPanel tasks={tasks.tasks} loading={tasks.loading} error={tasks.error} onComplete={tasks.markComplete} />
      </div>
    </div>
  )
}
