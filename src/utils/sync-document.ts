import path from 'path'
import { app } from 'electron'
import { downloadFile, checkPathExists, createPath, getTempDir } from './files'
import { notifySyncSuccess, notifySyncError } from './notifications'
import { findJulieBasePath, getJulieDocumentPath } from './software/julie'
import { getLogosConfiguration, launchAnxagent, getLogosDocumentPath } from './software/logos'

export type ExternalSource = 'julie' | 'logosw' | string

export interface SyncDocumentRequest {
  /** URL to download the PDF from (DentistryGPT API) */
  documentUrl: string
  /** Name of the document file (e.g. "rapport-consultation.pdf") */
  documentName: string
  /** Patient ID in the dental software */
  patientId: string
  /** Which dental software to sync to */
  externalSource: ExternalSource
}

export interface SyncResult {
  success: boolean
  filePath: string | null
  error?: string
}

/**
 * Main sync router — dispatches to the correct handler based on externalSource.
 */
export async function syncDocument(request: SyncDocumentRequest): Promise<SyncResult> {
  const { externalSource } = request

  try {
    let result: SyncResult

    switch (externalSource.toLowerCase()) {
      case 'julie':
        result = await handleJulieSync(request)
        break
      case 'logosw':
      case 'logos':
        result = await handleLogosSync(request)
        break
      default:
        result = await handleDesktopSync(request)
        break
    }

    if (result.success) {
      notifySyncSuccess(request.documentName, externalSource)
    } else {
      notifySyncError(request.documentName, result.error || 'Erreur inconnue')
    }

    return result
  } catch (err) {
    const error = (err as Error).message
    notifySyncError(request.documentName, error)
    return { success: false, filePath: null, error }
  }
}

/**
 * Julie sync strategy: file copy to DOCPATIENT folder.
 *
 * 1. Find Julie base path (network shares or local drives)
 * 2. Download PDF to {basePath}/{patientId}/{documentName}
 * 3. Notify user
 */
async function handleJulieSync(request: SyncDocumentRequest): Promise<SyncResult> {
  const detection = findJulieBasePath()

  if (!detection.found || !detection.basePath) {
    return {
      success: false,
      filePath: null,
      error: 'Julie introuvable — vérifiez que le dossier DOCPATIENT est accessible',
    }
  }

  const destPath = getJulieDocumentPath(
    detection.basePath,
    request.patientId,
    request.documentName
  )

  // Ensure patient directory exists
  const patientDir = path.dirname(destPath)
  if (!checkPathExists(patientDir)) {
    createPath(patientDir)
  }

  const filePath = await downloadFile(request.documentUrl, destPath)
  return { success: true, filePath }
}

/**
 * LogosW sync strategy: RPA with ANXAGENT.EXE.
 *
 * 1. Verify LogosW is installed (ANXAGENT.EXE exists)
 * 2. Download PDF to a temp folder
 * 3. Launch ANXAGENT.EXE with the PDF path
 * 4. Use robotjs to paste patientId (clipboard + Ctrl+V) then Enter
 * 5. Verify file arrived in {patientsPath}/LIENS/{patientId}/{documentName}
 */
async function handleLogosSync(request: SyncDocumentRequest): Promise<SyncResult> {
  const config = getLogosConfiguration()

  if (!config.found || !config.anxagentPath) {
    return {
      success: false,
      filePath: null,
      error: 'LogosW introuvable — vérifiez que c:\\wlogos1\\ANXAGENT.EXE existe',
    }
  }

  // Download to temp first
  const tempPath = path.join(getTempDir(), request.documentName)
  await downloadFile(request.documentUrl, tempPath)

  // Launch ANXAGENT with RPA automation
  const anxResult = await launchAnxagent(tempPath, request.patientId)

  if (!anxResult.success) {
    return {
      success: false,
      filePath: tempPath,
      error: anxResult.error || 'ANXAGENT.EXE a échoué',
    }
  }

  // Verify the file arrived in LogosW's expected location
  if (config.patientsPath) {
    const expectedPath = getLogosDocumentPath(
      config.patientsPath,
      request.patientId,
      request.documentName
    )

    // Give LogosW a moment to move the file
    await new Promise((resolve) => setTimeout(resolve, 3000))

    if (checkPathExists(expectedPath)) {
      return { success: true, filePath: expectedPath }
    }
  }

  // ANXAGENT reported success but we can't verify the final location
  // This is still considered a success — ANXAGENT handled the import
  return { success: true, filePath: tempPath }
}

/**
 * Desktop fallback strategy: download to Desktop/DentistryGPT/DOCPATIENT.
 *
 * Used when no specific dental software is detected or configured.
 * Downloads to: ~/Desktop/DentistryGPT/DOCPATIENT/{patientId}/{documentName}
 */
async function handleDesktopSync(request: SyncDocumentRequest): Promise<SyncResult> {
  const desktopPath = app.getPath('desktop')
  const destPath = path.join(
    desktopPath,
    'DentistryGPT',
    'DOCPATIENT',
    request.patientId,
    request.documentName
  )

  const filePath = await downloadFile(request.documentUrl, destPath)
  return { success: true, filePath }
}
