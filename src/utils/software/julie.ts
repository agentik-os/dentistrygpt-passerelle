import path from 'path'
import { checkPathExists } from '../files'

interface JulieDetectionResult {
  found: boolean
  basePath: string | null
}

/**
 * Well-known network share paths where Julie stores patient documents.
 */
const JULIE_NETWORK_PATHS = [
  '\\\\SERVEUR\\Juliew\\DOCPATIENT',
  '\\\\SERVEUR\\juliew\\DOCPATIENT',
  '\\\\serveur\\Juliew\\DOCPATIENT',
  '\\\\serveur\\juliew\\DOCPATIENT',
]

/**
 * Find the Julie DOCPATIENT base path.
 *
 * Strategy:
 * 1. Check known network share paths (\\SERVEUR\Juliew\DOCPATIENT)
 * 2. Scan local drives A: through Z: for juliew\DOCPATIENT
 *
 * Returns { found: true, basePath } if located, { found: false, basePath: null } otherwise.
 */
export function findJulieBasePath(): JulieDetectionResult {
  // 1. Check network shares first (most common Julie setup)
  for (const networkPath of JULIE_NETWORK_PATHS) {
    if (checkPathExists(networkPath)) {
      return { found: true, basePath: networkPath }
    }
  }

  // 2. Scan local/mapped drives A: through Z:
  for (let charCode = 65; charCode <= 90; charCode++) {
    const driveLetter = String.fromCharCode(charCode)
    const candidatePaths = [
      path.join(`${driveLetter}:\\`, 'juliew', 'DOCPATIENT'),
      path.join(`${driveLetter}:\\`, 'Juliew', 'DOCPATIENT'),
      path.join(`${driveLetter}:\\`, 'JULIEW', 'DOCPATIENT'),
    ]

    for (const candidate of candidatePaths) {
      if (checkPathExists(candidate)) {
        return { found: true, basePath: candidate }
      }
    }
  }

  return { found: false, basePath: null }
}

/**
 * Build the destination path for a Julie document sync.
 * Julie expects: {basePath}/{patientId}/{documentName}
 */
export function getJulieDocumentPath(
  basePath: string,
  patientId: string,
  documentName: string
): string {
  return path.join(basePath, patientId, documentName)
}
