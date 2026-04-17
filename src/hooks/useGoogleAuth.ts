import { useState, useEffect, useCallback, useRef } from 'react'
import { Preferences } from '@capacitor/preferences'

const TOKEN_KEY = 'google_access_token'
const EXPIRY_KEY = 'google_token_expiry'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/tasks',
].join(' ')

export interface AuthState {
  accessToken: string | null
  loading: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (resp: { access_token?: string; expires_in?: number; error?: string }) => void
          }) => { requestAccessToken: () => void }
        }
      }
    }
  }
}

export function useGoogleAuth(): AuthState {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const clientRef = useRef<{ requestAccessToken: () => void } | null>(null)
  const resolveRef = useRef<((token: string) => void) | null>(null)
  const rejectRef = useRef<((err: Error) => void) | null>(null)

  useEffect(() => {
    restoreToken()
  }, [])

  async function restoreToken() {
    try {
      const { value: token } = await Preferences.get({ key: TOKEN_KEY })
      const { value: expiry } = await Preferences.get({ key: EXPIRY_KEY })
      if (token && expiry && Date.now() < Number(expiry)) {
        setAccessToken(token)
      }
    } catch {
      // no stored token
    } finally {
      setLoading(false)
    }
  }

  function initClient(): Promise<{ requestAccessToken: () => void }> {
    return new Promise((resolve, reject) => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (!clientId) {
        reject(new Error('VITE_GOOGLE_CLIENT_ID not set'))
        return
      }

      function tryInit() {
        if (window.google?.accounts?.oauth2) {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: (resp) => {
              if (resp.error || !resp.access_token) {
                rejectRef.current?.(new Error(resp.error ?? 'No token returned'))
              } else {
                resolveRef.current?.(resp.access_token)
              }
            },
          })
          resolve(client)
        } else {
          setTimeout(tryInit, 100)
        }
      }
      tryInit()
    })
  }

  const signIn = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (!clientRef.current) {
        clientRef.current = await initClient()
      }

      const token = await new Promise<string>((resolve, reject) => {
        resolveRef.current = resolve
        rejectRef.current = reject
        clientRef.current!.requestAccessToken()
      })

      const expiry = Date.now() + 55 * 60 * 1000
      await Preferences.set({ key: TOKEN_KEY, value: token })
      await Preferences.set({ key: EXPIRY_KEY, value: String(expiry) })
      setAccessToken(token)
    } catch (e) {
      setError('Sign-in failed. Tap to retry.')
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    await Preferences.remove({ key: TOKEN_KEY })
    await Preferences.remove({ key: EXPIRY_KEY })
    setAccessToken(null)
    clientRef.current = null
  }, [])

  return { accessToken, loading, error, signIn, signOut }
}
