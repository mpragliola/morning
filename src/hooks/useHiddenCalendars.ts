import { useState, useEffect, useCallback } from 'react'
import { Preferences } from '@capacitor/preferences'

const PREFS_KEY = 'hidden_calendar_ids'

export function useHiddenCalendars() {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    Preferences.get({ key: PREFS_KEY }).then(({ value }) => {
      if (value) setHiddenIds(new Set(JSON.parse(value) as string[]))
    })
  }, [])

  const toggleHidden = useCallback((calendarId: string) => {
    setHiddenIds(prev => {
      const next = new Set(prev)
      if (next.has(calendarId)) {
        next.delete(calendarId)
      } else {
        next.add(calendarId)
      }
      Preferences.set({ key: PREFS_KEY, value: JSON.stringify([...next]) })
      return next
    })
  }, [])

  return { hiddenIds, toggleHidden }
}
