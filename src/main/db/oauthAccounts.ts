import { dbData, saveDb } from './store'
import type { OAuthAccount } from './types'

export function getOAuthAccounts(): OAuthAccount[] {
  return dbData.oauthAccounts || []
}

// Accounts are only ever exposed to the renderer stripped of their encrypted tokens — shared by
// both the YouTube and Spotify IPC handlers.
export function toPublicOAuthAccount(
  account: OAuthAccount
): Omit<OAuthAccount, 'accessTokenEnc' | 'refreshTokenEnc'> {
  const { accessTokenEnc, refreshTokenEnc, ...rest } = account
  void accessTokenEnc
  void refreshTokenEnc
  return rest
}

export function addOAuthAccount(account: OAuthAccount): void {
  if (!dbData.oauthAccounts) dbData.oauthAccounts = []
  const index = dbData.oauthAccounts.findIndex((a) => a.id === account.id)
  if (index !== -1) {
    dbData.oauthAccounts[index] = account
  } else {
    dbData.oauthAccounts.push(account)
  }
  saveDb()
}

export function updateOAuthAccountTokens(
  accountId: string,
  tokens: { accessTokenEnc: string; refreshTokenEnc?: string; expiresAt: number }
): void {
  const account = (dbData.oauthAccounts || []).find((a) => a.id === accountId)
  if (account) {
    account.accessTokenEnc = tokens.accessTokenEnc
    if (tokens.refreshTokenEnc) account.refreshTokenEnc = tokens.refreshTokenEnc
    account.expiresAt = tokens.expiresAt
    saveDb()
  }
}

export function removeOAuthAccount(accountId: string): void {
  dbData.oauthAccounts = (dbData.oauthAccounts || []).filter((a) => a.id !== accountId)
  saveDb()
}
