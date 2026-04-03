import { app, ipcMain, shell } from 'electron'
import { apiService } from '../../services/api-service'
import {
  getStoredTokens,
  storeTokens,
  handleLogout,
  isTokenExpiringSoon,
  handleTokenRefresh,
} from '../../utils/auth'

const PROTOCOL = 'dentistrygpt-passerelle'
const LOGIN_URL = 'https://www.dentistrygpt.com/sign-in?redirect_url=/api/passerelle/auth/callback'

// Deep link handler — resolves when a token is received via protocol
let pendingAuthResolve: ((token: string) => void) | null = null

export function handleDeepLink(url: string): void {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== `${PROTOCOL}:`) return

    if (parsed.hostname === 'auth' || parsed.pathname === '//auth') {
      const token = parsed.searchParams.get('token')
      if (token && pendingAuthResolve) {
        pendingAuthResolve(token)
        pendingAuthResolve = null
      }
    }
  } catch {
    // Invalid URL, ignore
  }
}

export function registerAuthHandlers(): void {
  // Register custom protocol for deep links
  if (!app.isDefaultProtocolClient(PROTOCOL)) {
    app.setAsDefaultProtocolClient(PROTOCOL)
  }

  // Handle deep links on macOS
  app.on('open-url', (_event, url) => {
    handleDeepLink(url)
  })

  // Handle deep links on Windows/Linux (second instance)
  app.on('second-instance', (_event, commandLine) => {
    const url = commandLine.find((arg) => arg.startsWith(`${PROTOCOL}://`))
    if (url) handleDeepLink(url)
  })

  // Opens browser for Clerk login, waits for deep link callback
  ipcMain.handle('auth:login', async () => {
    await shell.openExternal(LOGIN_URL)
    return { success: true }
  })

  // Clears tokens
  ipcMain.handle('auth:logout', async () => {
    handleLogout()
    return { success: true }
  })

  // Returns current auth status
  ipcMain.handle('auth:get-status', async () => {
    const tokens = getStoredTokens()
    if (!tokens) {
      return { isAuthenticated: false, user: null }
    }

    // Auto-refresh if expiring soon
    if (isTokenExpiringSoon(tokens.expiresAt)) {
      const refreshed = await handleTokenRefresh()
      if (!refreshed) {
        handleLogout()
        return { isAuthenticated: false, user: null }
      }
    }

    try {
      const user = await apiService.getMe()
      return { isAuthenticated: true, user }
    } catch {
      return { isAuthenticated: false, user: null }
    }
  })

  // Exchanges authorization code for tokens (called after deep link or manual code entry)
  ipcMain.handle('auth:exchange-token', async (_event, code: string) => {
    try {
      const tokens = await apiService.exchangeToken(code)
      storeTokens(tokens)
      const user = await apiService.getMe()

      // Save cabinet name from first organization
      if (user.organizations?.[0]?.name) {
        const Store = require('electron-store')
        new Store().set('cabinet_name', user.organizations[0].name)
      }

      return { success: true, user }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // Waits for deep link auth callback (with timeout)
  ipcMain.handle('auth:wait-for-callback', async (_event, timeoutMs: number = 300000) => {
    return new Promise<{ success: boolean; token?: string }>((resolve) => {
      const timer = setTimeout(() => {
        pendingAuthResolve = null
        resolve({ success: false })
      }, timeoutMs)

      pendingAuthResolve = (token: string) => {
        clearTimeout(timer)
        resolve({ success: true, token })
      }
    })
  })
}
