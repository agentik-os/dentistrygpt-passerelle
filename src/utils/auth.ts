import Store from 'electron-store'
import { apiService, TokenResponse } from '../services/api-service'

const store = new Store()

const DEFAULT_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

export interface StoredTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export function isTokenExpiringSoon(
  expiresAt: number,
  thresholdMs: number = DEFAULT_THRESHOLD_MS
): boolean {
  return Date.now() >= expiresAt - thresholdMs
}

export function getStoredTokens(): StoredTokens | null {
  const accessToken = store.get('auth.accessToken') as string | undefined
  const refreshToken = store.get('auth.refreshToken') as string | undefined
  const expiresAt = store.get('auth.expiresAt') as number | undefined

  if (!accessToken || !refreshToken || !expiresAt) return null

  return { accessToken, refreshToken, expiresAt }
}

export function storeTokens(tokens: TokenResponse): void {
  store.set('auth.accessToken', tokens.access_token)
  store.set('auth.refreshToken', tokens.refresh_token)
  store.set('auth.expiresAt', Date.now() + tokens.expires_in * 1000)
}

export async function handleTokenRefresh(): Promise<boolean> {
  const stored = getStoredTokens()
  if (!stored) return false

  try {
    const newTokens = await apiService.refreshToken(stored.refreshToken)
    storeTokens(newTokens)
    return true
  } catch {
    return false
  }
}

export function handleLogout(): void {
  store.delete('auth.accessToken')
  store.delete('auth.refreshToken')
  store.delete('auth.expiresAt')
}
