import path from 'path'
import { execFile } from 'child_process'
import { clipboard } from 'electron'
import { checkPathExists } from '../files'

const LOGOS_INSTALL_PATH = 'c:\\wlogos1'
const ANXAGENT_EXE = path.join(LOGOS_INSTALL_PATH, 'ANXAGENT.EXE')
const CONFIG_EXE = path.join(LOGOS_INSTALL_PATH, 'config.exe')

interface LogosDetectionResult {
  found: boolean
  anxagentPath: string | null
  patientsPath: string | null
}

/**
 * Check if LogosW is installed by verifying ANXAGENT.EXE exists.
 */
export function isLogosInstalled(): boolean {
  return checkPathExists(ANXAGENT_EXE)
}

/**
 * Get LogosW configuration.
 *
 * Detects LogosW installation and determines the patients path.
 * The default patients path is c:\wlogos1\PATIENTS — most installations
 * use this. If config.exe is available, we could query it, but the
 * standard path is reliable for 95%+ of installations.
 */
export function getLogosConfiguration(): LogosDetectionResult {
  if (!isLogosInstalled()) {
    return { found: false, anxagentPath: null, patientsPath: null }
  }

  // Default LogosW patients directory
  const defaultPatientsPath = path.join(LOGOS_INSTALL_PATH, 'PATIENTS')
  const patientsPath = checkPathExists(defaultPatientsPath) ? defaultPatientsPath : null

  return {
    found: true,
    anxagentPath: ANXAGENT_EXE,
    patientsPath,
  }
}

/**
 * Launch ANXAGENT.EXE to import a document into LogosW.
 *
 * ANXAGENT.EXE is the LogosW document import agent. It:
 * 1. Opens a dialog asking for the patient ID
 * 2. Imports the file into the patient's LIENS folder
 *
 * We automate this with robotjs:
 * - Launch ANXAGENT.EXE with the file path
 * - Use clipboard to paste the patientId
 * - Press Enter to confirm
 */
export function launchAnxagent(
  filePath: string,
  patientId: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    // Dynamic import robotjs (native module, may not be available)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let robot: { keyTap: (key: string, modifier?: string[]) => void }
    try {
      robot = require('robotjs') as typeof robot
    } catch {
      resolve({ success: false, error: 'robotjs non disponible — installation native requise' })
      return
    }

    // Launch ANXAGENT.EXE with the PDF path as argument
    const child = execFile(ANXAGENT_EXE, [filePath], (error) => {
      if (error) {
        resolve({ success: false, error: `ANXAGENT.EXE a échoué: ${error.message}` })
      }
    })

    // Wait for the ANXAGENT dialog to appear, then paste patientId
    setTimeout(() => {
      try {
        // Copy patientId to clipboard
        clipboard.writeText(patientId)

        // Simulate Ctrl+V to paste
        robot.keyTap('v', ['control'])

        // Wait a beat, then press Enter to confirm
        setTimeout(() => {
          robot.keyTap('enter')

          // Give ANXAGENT time to process, then resolve
          setTimeout(() => {
            resolve({ success: true })
          }, 2000)
        }, 500)
      } catch (err) {
        resolve({ success: false, error: `Erreur RPA: ${(err as Error).message}` })
      }
    }, 2000) // Wait 2s for ANXAGENT dialog to appear

    // Safety timeout — kill child if it hangs
    setTimeout(() => {
      if (!child.killed) {
        child.kill()
      }
    }, 30_000)
  })
}

/**
 * Build the expected destination path for LogosW document verification.
 * LogosW stores linked documents in: {patientsPath}/LIENS/{patientId}/{documentName}
 */
export function getLogosDocumentPath(
  patientsPath: string,
  patientId: string,
  documentName: string
): string {
  return path.join(patientsPath, 'LIENS', patientId, documentName)
}
