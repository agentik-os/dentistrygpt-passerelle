import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'

const DOWNLOAD_TIMEOUT_MS = 30_000

/**
 * Check if a path exists on the filesystem.
 */
export function checkPathExists(targetPath: string): boolean {
  try {
    fs.accessSync(targetPath, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Create a directory path recursively (mkdir -p).
 */
export function createPath(targetPath: string): void {
  fs.mkdirSync(targetPath, { recursive: true })
}

/**
 * Download a file from a URL to a local destination.
 * Supports both http and https. Follows redirects (up to 5).
 * Returns the final file path on success.
 */
export function downloadFile(
  url: string,
  destPath: string,
  timeoutMs: number = DOWNLOAD_TIMEOUT_MS
): Promise<string> {
  return new Promise((resolve, reject) => {
    const destDir = path.dirname(destPath)
    if (!checkPathExists(destDir)) {
      createPath(destDir)
    }

    const doRequest = (requestUrl: string, redirectCount: number) => {
      if (redirectCount > 5) {
        reject(new Error('Too many redirects'))
        return
      }

      const client = requestUrl.startsWith('https') ? https : http
      const req = client.get(requestUrl, (res) => {
        // Handle redirects
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          doRequest(res.headers.location, redirectCount + 1)
          return
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Download failed with status ${res.statusCode}`))
          return
        }

        const fileStream = fs.createWriteStream(destPath)
        res.pipe(fileStream)

        fileStream.on('finish', () => {
          fileStream.close()
          resolve(destPath)
        })

        fileStream.on('error', (err) => {
          fs.unlink(destPath, () => {})
          reject(err)
        })
      })

      req.on('error', (err) => {
        reject(err)
      })

      req.setTimeout(timeoutMs, () => {
        req.destroy()
        reject(new Error(`Download timed out after ${timeoutMs}ms`))
      })
    }

    doRequest(url, 0)
  })
}

/**
 * Get a temporary directory path for intermediate files.
 */
export function getTempDir(): string {
  const tmpDir = path.join(
    process.env.TEMP || process.env.TMP || '/tmp',
    'dentistrygpt-passerelle'
  )
  if (!checkPathExists(tmpDir)) {
    createPath(tmpDir)
  }
  return tmpDir
}
