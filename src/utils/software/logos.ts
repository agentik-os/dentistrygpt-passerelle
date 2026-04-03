import path from 'path'
import { exec, execFile } from 'child_process'
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
 * Simulate keyboard input using PowerShell (Windows) or AppleScript (macOS).
 * Replaces robotjs native module — pure JS, no compilation needed.
 */
function simulateKeyboardInput(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (process.platform === 'win32') {
      // PowerShell: set clipboard + Ctrl+V + Enter
      const psScript = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.Clipboard]::SetText("${text.replace(/"/g, '`"')}")
Start-Sleep -Milliseconds 300
[System.Windows.Forms.SendKeys]::SendWait("^v")
Start-Sleep -Milliseconds 500
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
`.trim()
      exec(`powershell -NoProfile -Command "${psScript.replace(/"/g, '\\"')}"`, (error) => {
        if (error) reject(error)
        else resolve()
      })
    } else if (process.platform === 'darwin') {
      // AppleScript: keystroke the text + return
      const script = `
tell application "System Events"
  keystroke "${text.replace(/"/g, '\\"')}"
  delay 0.5
  keystroke return
end tell
`.trim()
      exec(`osascript -e '${script.replace(/'/g, "'\\''")}'`, (error) => {
        if (error) reject(error)
        else resolve()
      })
    } else {
      // Linux: use xdotool if available
      exec(`xdotool type --clearmodifiers "${text}" && xdotool key Return`, (error) => {
        if (error) reject(error)
        else resolve()
      })
    }
  })
}

/**
 * Launch ANXAGENT.EXE to import a document into LogosW.
 *
 * ANXAGENT.EXE is the LogosW document import agent. It:
 * 1. Opens a dialog asking for the patient ID
 * 2. Imports the file into the patient's LIENS folder
 *
 * Automation via PowerShell/AppleScript (no native modules):
 * - Launch ANXAGENT.EXE with the file path
 * - Use clipboard + SendKeys to paste the patientId
 * - Press Enter to confirm
 */
export function launchAnxagent(
  filePath: string,
  patientId: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    // Launch ANXAGENT.EXE with the PDF path as argument
    const child = execFile(ANXAGENT_EXE, [filePath], (error) => {
      if (error) {
        resolve({ success: false, error: `ANXAGENT.EXE a échoué: ${error.message}` })
      }
    })

    // Wait for the ANXAGENT dialog to appear, then paste patientId
    setTimeout(async () => {
      try {
        // Copy patientId to clipboard (Electron API)
        clipboard.writeText(patientId)

        // Simulate keyboard: paste + Enter via OS-native approach
        await simulateKeyboardInput(patientId)

        // Give ANXAGENT time to process, then resolve
        setTimeout(() => {
          resolve({ success: true })
        }, 2000)
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
