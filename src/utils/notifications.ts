import { Notification } from 'electron'

interface NotificationOptions {
  title: string
  body: string
  icon?: string
}

/**
 * Send a system notification via Electron's Notification API.
 * Silent no-op if notifications are not supported.
 */
export function sendNotification(options: NotificationOptions): void {
  if (!Notification.isSupported()) return

  const notification = new Notification({
    title: options.title,
    body: options.body,
    icon: options.icon,
  })

  notification.show()
}

/**
 * Notify user of successful document sync.
 */
export function notifySyncSuccess(documentName: string, software: string): void {
  sendNotification({
    title: 'Document synchronisé',
    body: `${documentName} a été envoyé vers ${software}`,
  })
}

/**
 * Notify user of sync failure.
 */
export function notifySyncError(documentName: string, error: string): void {
  sendNotification({
    title: 'Erreur de synchronisation',
    body: `Impossible de synchroniser ${documentName}: ${error}`,
  })
}
