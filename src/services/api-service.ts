import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import Store from 'electron-store'

// --- Types ---

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: 'Bearer'
  expires_in: number
}

export interface TokenError {
  error: string
  error_description: string
}

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  organizations: { id: string; name: string }[]
}

export interface HealthResponse {
  status: 'ok'
  version: string
  service: string
  timestamp: string
}

export interface Patient {
  id: string
  externalId?: string
  firstName: string
  lastName: string
  birthDate?: string
  email?: string
  phone?: string
  gender?: string
}

export interface PatientsResponse {
  patients: Patient[]
}

export interface PatientInput {
  externalId?: string
  firstName: string
  lastName: string
  birthDate?: string
  email?: string
  phone?: string
  gender?: string
}

export interface PatientResult {
  patientId: string
  created: boolean
}

export interface DocumentInfo {
  id: string
  name: string
  type: string
  mimeType: string
  size: number
  status: string
  createdAt: string
  updatedAt: string
  storageUrl: string
}

export interface DownloadResponse {
  pdfUrl: string
  fileName: string
}

export interface StatusInput {
  success: boolean
  directory?: string
  path?: string
  error?: string
  version?: string
}

export interface StatusResponse {
  success: true
  documentId: string
  syncedAt: string
}

export interface OrganizationInfo {
  id: string
  name: string
  address: string
  city: string
  postalCode: string
  phone: string
  email: string
}

// --- Store ---

const store = new Store()

// --- API Service ---

const APP_VERSION = '1.0.0'

const baseURL =
  (typeof process !== 'undefined' && process.env.VITE_DENTISTRYGPT_API_URL) ||
  'https://www.dentistrygpt.com'

let isRefreshing = false
let failedQueue: {
  resolve: (token: string) => void
  reject: (err: unknown) => void
}[] = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

const client: AxiosInstance = axios.create({
  baseURL: `${baseURL}/api/passerelle`,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': `DentistryGPT-Passerelle/${APP_VERSION}`,
  },
  timeout: 30000,
})

// Request interceptor: attach auth token
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = store.get('auth.accessToken') as string | undefined
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: 401 auto-refresh + 429 retry
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number }
    if (!originalRequest) return Promise.reject(error)

    // 429 retry with exponential backoff
    if (error.response?.status === 429) {
      const retryCount = originalRequest._retryCount || 0
      if (retryCount < 3) {
        originalRequest._retryCount = retryCount + 1
        const delay = Math.pow(2, retryCount) * 1000
        await new Promise((r) => setTimeout(r, delay))
        return client(originalRequest)
      }
      return Promise.reject(error)
    }

    // 401 auto-refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return client(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshTokenValue = store.get('auth.refreshToken') as string | undefined
        if (!refreshTokenValue) {
          throw new Error('No refresh token available')
        }

        const { data } = await axios.post<TokenResponse>(
          `${baseURL}/api/passerelle/auth/token`,
          { grant_type: 'refresh_token', refresh_token: refreshTokenValue },
          { headers: { 'Content-Type': 'application/json' } }
        )

        store.set('auth.accessToken', data.access_token)
        store.set('auth.refreshToken', data.refresh_token)
        store.set('auth.expiresAt', Date.now() + data.expires_in * 1000)

        processQueue(null, data.access_token)

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        }
        return client(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        store.delete('auth.accessToken')
        store.delete('auth.refreshToken')
        store.delete('auth.expiresAt')
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// --- Public API ---

export const apiService = {
  async exchangeToken(code: string): Promise<TokenResponse> {
    const { data } = await client.post<TokenResponse>('/auth/token', {
      grant_type: 'authorization_code',
      code,
    })
    return data
  },

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const { data } = await client.post<TokenResponse>('/auth/token', {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })
    return data
  },

  async getMe(): Promise<UserProfile> {
    const { data } = await client.get<UserProfile>('/me')
    return data
  },

  async getHealth(): Promise<HealthResponse> {
    const { data } = await client.get<HealthResponse>('/health')
    return data
  },

  async getPatients(limit?: number): Promise<PatientsResponse> {
    const { data } = await client.get<PatientsResponse>('/patients', {
      params: limit ? { limit } : undefined,
    })
    return data
  },

  async upsertPatient(input: PatientInput): Promise<PatientResult> {
    const { data } = await client.post<PatientResult>('/patients', input)
    return data
  },

  async getDocument(uuid: string): Promise<DocumentInfo> {
    const { data } = await client.get<DocumentInfo>(`/documents/${uuid}`)
    return data
  },

  async downloadDocument(uuid: string): Promise<DownloadResponse> {
    const { data } = await client.post<DownloadResponse>(`/documents/${uuid}/download`)
    return data
  },

  async updateDocumentStatus(uuid: string, input: StatusInput): Promise<StatusResponse> {
    const { data } = await client.post<StatusResponse>(`/documents/${uuid}/status`, input)
    return data
  },

  async getOrganization(id: string): Promise<OrganizationInfo> {
    const { data } = await client.get<OrganizationInfo>(`/organizations/${id}`)
    return data
  },

  async getPendingDocuments(limit?: number): Promise<PendingDocumentsResponse> {
    const { data } = await client.get<PendingDocumentsResponse>('/documents/pending', {
      params: limit ? { limit } : undefined,
    })
    return data
  },
}

export interface PendingDocument {
  id: string
  name: string
  type: string
  description: string | null
  size: number
  tags: string[]
  createdAt: number
}

export interface PendingDocumentsResponse {
  documents: PendingDocument[]
  total: number
}

export type ApiService = typeof apiService
