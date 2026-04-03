import type {
  UserProfile,
  HealthResponse,
  PatientsResponse,
  PatientInput,
  PatientResult,
  DocumentInfo,
  DownloadResponse,
  StatusInput,
  StatusResponse,
  OrganizationInfo,
  PendingDocumentsResponse,
} from '../services/api-service'

import type { SyncDocumentRequest, SyncResult } from '../utils/sync-document'

interface IpcResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface ElectronAPI {
  getVersion: () => Promise<string>

  auth: {
    login: () => Promise<{ success: boolean }>
    logout: () => Promise<{ success: boolean }>
    getStatus: () => Promise<{
      isAuthenticated: boolean
      user: { id: string; email: string; firstName: string; lastName: string } | null
    }>
    exchangeToken: (code: string) => Promise<{
      success: boolean
      user?: { id: string; email: string; firstName: string; lastName: string }
      error?: string
    }>
  }

  api: {
    getPatients: (limit?: number) => Promise<IpcResult<PatientsResponse>>
    upsertPatient: (data: PatientInput) => Promise<IpcResult<PatientResult>>
    getDocument: (uuid: string) => Promise<IpcResult<DocumentInfo>>
    downloadDocument: (uuid: string) => Promise<IpcResult<DownloadResponse>>
    updateDocumentStatus: (uuid: string, data: StatusInput) => Promise<IpcResult<StatusResponse>>
    getOrganization: (id: string) => Promise<IpcResult<OrganizationInfo>>
    getMe: () => Promise<IpcResult<UserProfile>>
    healthCheck: () => Promise<IpcResult<HealthResponse>>
    getPendingDocuments: (limit?: number) => Promise<IpcResult<PendingDocumentsResponse>>
  }

  openDirectory: () => Promise<string | null>

  sync: (request: SyncDocumentRequest) => Promise<SyncResult>

  store: {
    get: (key: string) => Promise<unknown>
    set: (key: string, value: unknown) => Promise<{ success: boolean }>
  }

  on: (channel: string, callback: (...args: unknown[]) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
