import { useState, useEffect, useCallback } from 'react'
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'
import { Preferences } from '@capacitor/preferences'

const TOKEN_KEY = 'google_access_token'
const EXPIRY_KEY = 'google_token_expiry'

export interface AuthState {
  accessToken: string | null
  loading: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

export function useGoogleAuth(): AuthState {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    GoogleAuth.initialize({
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scopes: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/tasks',
      ],
      grantOfflineAccess: true,
    })
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
      // no stored token — user needs to sign in
    } finally {
      setLoading(false)
    }
  }

  const signIn = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const user = await GoogleAuth.signIn()
      const token = user.authentication.accessToken
      const expiry = Date.now() + 55 * 60 * 1000 // treat as 55-min lifetime
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
    await GoogleAuth.signOut()
    await Preferences.remove({ key: TOKEN_KEY })
    await Preferences.remove({ key: EXPIRY_KEY })
    setAccessToken(null)
  }, [])

  return { accessToken, loading, error, signIn, signOut }
}
