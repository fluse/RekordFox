import { dbData, saveDb } from './store'

export function getDiscoverBlacklist(): string[] {
  return dbData.discoverBlacklist || []
}

export function addToDiscoverBlacklist(videoId: string): void {
  if (!dbData.discoverBlacklist) dbData.discoverBlacklist = []
  if (!dbData.discoverBlacklist.includes(videoId)) {
    dbData.discoverBlacklist.push(videoId)
    saveDb()
  }
}

export function removeFromDiscoverBlacklist(videoId: string): void {
  if (!dbData.discoverBlacklist) return
  const next = dbData.discoverBlacklist.filter((id) => id !== videoId)
  if (next.length !== dbData.discoverBlacklist.length) {
    dbData.discoverBlacklist = next
    saveDb()
  }
}
