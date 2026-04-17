// src/components/LeftPanel/ClockWidget.tsx
import { useState, useEffect } from 'react'

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function ClockWidget() {
  const [time, setTime] = useState(() => formatTime(new Date()))

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <div style={{ fontSize: '96px', fontWeight: 300, lineHeight: 1, letterSpacing: '-2px' }}>
        {time}
      </div>
    </div>
  )
}
