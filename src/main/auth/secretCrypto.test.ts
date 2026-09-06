import { describe, expect, it, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  isEncryptionAvailable: vi.fn(),
  encryptString: vi.fn(),
  decryptString: vi.fn()
}))

vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: mocks.isEncryptionAvailable,
    encryptString: mocks.encryptString,
    decryptString: mocks.decryptString
  }
}))

import { encryptSecret, decryptSecret } from './secretCrypto'

describe('encryptSecret / decryptSecret', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('round-trips a value through safeStorage when OS encryption is available', () => {
    mocks.isEncryptionAvailable.mockReturnValue(true)
    mocks.encryptString.mockImplementation((value: string) => Buffer.from(`cipher(${value})`))
    mocks.decryptString.mockImplementation((buf: Buffer) => {
      const raw = buf.toString('utf-8')
      return raw.slice('cipher('.length, -1)
    })

    const stored = encryptSecret('super-secret-token')

    expect(stored.startsWith('enc:')).toBe(true)
    expect(decryptSecret(stored)).toBe('super-secret-token')
  })

  it('falls back to a plain base64 encoding when OS encryption is unavailable', () => {
    mocks.isEncryptionAvailable.mockReturnValue(false)

    const stored = encryptSecret('super-secret-token')

    expect(stored.startsWith('plain:')).toBe(true)
    expect(mocks.encryptString).not.toHaveBeenCalled()
    expect(decryptSecret(stored)).toBe('super-secret-token')
  })

  it('decrypts a plain-prefixed value without touching safeStorage', () => {
    const stored = 'plain:' + Buffer.from('legacy-token', 'utf-8').toString('base64')

    expect(decryptSecret(stored)).toBe('legacy-token')
    expect(mocks.decryptString).not.toHaveBeenCalled()
  })

  it('returns an empty string for an unrecognized or empty stored value', () => {
    expect(decryptSecret('')).toBe('')
    expect(decryptSecret('garbage')).toBe('')
  })
})
