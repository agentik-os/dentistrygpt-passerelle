import { ipcMain } from 'electron'
import { apiService, PatientInput, StatusInput } from '../../services/api-service'

export function registerApiHandlers(): void {
  ipcMain.handle('api:get-patients', async (_event, limit?: number) => {
    try {
      return { success: true, data: await apiService.getPatients(limit) }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('api:upsert-patient', async (_event, input: PatientInput) => {
    try {
      return { success: true, data: await apiService.upsertPatient(input) }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('api:get-document', async (_event, uuid: string) => {
    try {
      return { success: true, data: await apiService.getDocument(uuid) }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('api:download-document', async (_event, uuid: string) => {
    try {
      return { success: true, data: await apiService.downloadDocument(uuid) }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(
    'api:update-document-status',
    async (_event, uuid: string, input: StatusInput) => {
      try {
        return { success: true, data: await apiService.updateDocumentStatus(uuid, input) }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
  )

  ipcMain.handle('api:get-organization', async (_event, id: string) => {
    try {
      return { success: true, data: await apiService.getOrganization(id) }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('api:get-me', async () => {
    try {
      return { success: true, data: await apiService.getMe() }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('api:health-check', async () => {
    try {
      return { success: true, data: await apiService.getHealth() }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('api:get-pending-documents', async (_event, limit?: number) => {
    try {
      return { success: true, data: await apiService.getPendingDocuments(limit) }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}
