// tests/hooks/useGoogleAuth.test.ts
import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@codetrix-studio/capacitor-google-auth', () => ({
  GoogleAuth: {
    initialize: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  },
}))

import { useGoogleAuth } from '../../src/hooks/useGoogleAuth'

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn().mockResolvedValue({ value: null }),
    set: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}))

import { Preferences } from '@capacitor/preferences'

describe('useGoogleAuth', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('starts loading then resolves to no token when nothing stored', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({ value: null })
    const { result } = renderHook(() => useGoogleAuth())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.accessToken).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('restores a valid stored token on mount', async () => {
    const futureExpiry = String(Date.now() + 60 * 60 * 1000)
    vi.mocked(Preferences.get)
      .mockResolvedValueOnce({ value: 'stored-token' })
      .mockResolvedValueOnce({ value: futureExpiry })
    const { result } = renderHook(() => useGoogleAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.accessToken).toBe('stored-token')
  })

  it('does not restore an expired token', async () => {
    const pastExpiry = String(Date.now() - 1000)
    vi.mocked(Preferences.get)
      .mockResolvedValueOnce({ value: 'old-token' })
      .mockResolvedValueOnce({ value: pastExpiry })
    const { result } = renderHook(() => useGoogleAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.accessToken).toBeNull()
  })

  it('signOut clears token and removes from Preferences', async () => {
    const futureExpiry = String(Date.now() + 60 * 60 * 1000)
    vi.mocked(Preferences.get)
      .mockResolvedValueOnce({ value: 'stored-token' })
      .mockResolvedValueOnce({ value: futureExpiry })
    const { result } = renderHook(() => useGoogleAuth())
    await waitFor(() => expect(result.current.accessToken).toBe('stored-token'))

    await act(async () => { await result.current.signOut() })
    expect(result.current.accessToken).toBeNull()
    expect(Preferences.remove).toHaveBeenCalledWith({ key: 'google_access_token' })
    expect(Preferences.remove).toHaveBeenCalledWith({ key: 'google_token_expiry' })
  })
})
