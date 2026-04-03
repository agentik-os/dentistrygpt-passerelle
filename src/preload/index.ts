import { contextBridge, ipcRenderer } from 'electron'

const validOnChannels = [
  'update:available',
  'update:downloaded',
  'update:error',
  'auth:status-changed',
  'auth:deep-link',
] as const

const electronAPI = {
  getVersion: () => ipcRenderer.invoke('app:getVersion') as Promise<string>,

  auth: {
    login: () => ipcRenderer.invoke('auth:login') as Promise<{ success: boolean }>,
    logout: () => ipcRenderer.invoke('auth:logout') as Promise<{ success: boolean }>,
    getStatus: () =>
      ipcRenderer.invoke('auth:get-status') as Promise<{
        isAuthenticated: boolean
        user: { id: string; email: string; firstName: string; lastName: string } | null
      }>,
    exchangeToken: (code: string) =>
      ipcRenderer.invoke('auth:exchange-token', code) as Promise<{
        success: boolean
        user?: { id: string; email: string; firstName: string; lastName: string }
        error?: string
      }>,
  },

  api: {
    getPatients: (limit?: number) => ipcRenderer.invoke('api:get-patients', limit),
    upsertPatient: (data: {
      externalId?: string
      firstName: string
      lastName: string
      birthDate?: string
      email?: string
      phone?: string
      gender?: string
    }) => ipcRenderer.invoke('api:upsert-patient', data),
    getDocument: (uuid: string) => ipcRenderer.invoke('api:get-document', uuid),
    downloadDocument: (uuid: string) => ipcRenderer.invoke('api:download-document', uuid),
    updateDocumentStatus: (
      uuid: string,
      data: { success: boolean; directory?: string; path?: string; error?: string; version?: string }
    ) => ipcRenderer.invoke('api:update-document-status', uuid, data),
    getOrganization: (id: string) => ipcRenderer.invoke('api:get-organization', id),
    getMe: () => ipcRenderer.invoke('api:get-me'),
    healthCheck: () => ipcRenderer.invoke('api:health-check'),
    getPendingDocuments: (limit?: number) => ipcRenderer.invoke('api:get-pending-documents', limit),
  },

  sync: (request: {
    documentUrl: string
    documentName: string
    patientId: string
    externalSource: string
  }) => ipcRenderer.invoke('sync:document', request),

  openDirectory: () => ipcRenderer.invoke('dialog:open-directory') as Promise<string | null>,

  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value),
  },

  on: (channel: string, callback: (...args: unknown[]) => void) => {
    if ((validOnChannels as readonly string[]).includes(channel)) {
      const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
        callback(...args)
      ipcRenderer.on(channel, subscription)
      return () => ipcRenderer.removeListener(channel, subscription)
    }
    return () => {}
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
