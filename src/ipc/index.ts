import { registerAuthHandlers } from './auth/handlers'
import { registerApiHandlers } from './api/handlers'

export function registerAllIpcHandlers(): void {
  registerAuthHandlers()
  registerApiHandlers()
}
