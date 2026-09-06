import { safeStorage } from 'electron'

// Encrypts an OAuth secret (access/refresh token) before it's persisted to db.json, via Electron's
// OS-backed safeStorage where available. Falls back to a merely-encoded (not actually encrypted)
// form on setups where OS encryption isn't available, so the app still functions there — the
// prefix records which form a given stored value is in for decryptSecret.
export function encryptSecret(value: string): string {
  if (safeStorage.isEncryptionAvailable()) {
    return 'enc:' + safeStorage.encryptString(value).toString('base64')
  }
  return 'plain:' + Buffer.from(value, 'utf-8').toString('base64')
}

export function decryptSecret(stored: string): string {
  if (stored.startsWith('enc:')) {
    return safeStorage.decryptString(Buffer.from(stored.slice(4), 'base64'))
  }
  if (stored.startsWith('plain:')) {
    return Buffer.from(stored.slice(6), 'base64').toString('utf-8')
  }
  return ''
}
