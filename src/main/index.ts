import { app, BrowserWindow, dialog, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { autoUpdater } from 'electron-updater'
import Store from 'electron-store'
import path from 'path'
import { syncDocument, type SyncDocumentRequest } from '../utils/sync-document'
import { registerAllIpcHandlers } from '../ipc'

const store = new Store()

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

app.on('second-instance', (_event, argv) => {
  // Handle deep link on Windows/Linux
  const deepLinkUrl = argv.find((a) => a.startsWith('dentistrygpt-passerelle://'))
  if (deepLinkUrl) {
    try {
      const token = new URL(deepLinkUrl).searchParams.get('token')
      if (token && mainWindow) {
        mainWindow.webContents.send('auth:deep-link', token)
      }
    } catch {
      // Invalid URL, ignore
    }
  }

  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'DentistryGPT Passerelle',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }
}

function createTray() {
  const iconPath = path.join(__dirname, '../../resources/tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Ouvrir DentistryGPT Passerelle',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        } else {
          createWindow()
        }
      },
    },
    { type: 'separator' },
    { label: 'Quitter', click: () => app.quit() },
  ])

  tray.setToolTip('DentistryGPT Passerelle')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    } else {
      createWindow()
    }
  })
}

// Auto-updater
function setupAutoUpdater() {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update:available', info)
  })

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('update:downloaded', info)
  })

  autoUpdater.on('error', (error) => {
    mainWindow?.webContents.send('update:error', error.message)
  })

  setInterval(() => {
    autoUpdater.checkForUpdates().catch(() => {})
  }, 4 * 60 * 60 * 1000)

  autoUpdater.checkForUpdates().catch(() => {})
}

// IPC: Dialog
ipcMain.handle('dialog:open-directory', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  return result.canceled ? null : result.filePaths[0]
})

// IPC: App
ipcMain.handle('app:getVersion', () => app.getVersion())

// IPC: Store
ipcMain.handle('store:get', (_event, key: string) => store.get(key))
ipcMain.handle('store:set', (_event, key: string, value: unknown) => {
  store.set(key, value)
})

// IPC: Document Sync
ipcMain.handle('sync:document', async (_event, request: SyncDocumentRequest) => {
  return syncDocument(request)
})

// Handle deep links on macOS
app.on('open-url', (event, url) => {
  event.preventDefault()
  try {
    const token = new URL(url).searchParams.get('token')
    if (token && mainWindow) {
      mainWindow.webContents.send('auth:deep-link', token)
    }
  } catch {
    // Invalid URL, ignore
  }
})

// App lifecycle
app.whenReady().then(() => {
  app.setAsDefaultProtocolClient('dentistrygpt-passerelle')
  registerAllIpcHandlers()
  createWindow()
  createTray()
  setupAutoUpdater()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
