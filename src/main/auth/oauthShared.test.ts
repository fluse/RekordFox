import { describe, expect, it, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  getAllWindows: vi.fn()
}))

vi.mock('electron', () => ({
  BrowserWindow: { getAllWindows: mocks.getAllWindows }
}))

import { broadcastToAllWindows, focusMainWindow } from './oauthShared'

function makeWindow(overrides: Partial<Record<string, unknown>> = {}): {
  isDestroyed: () => boolean
  isMinimized: () => boolean
  restore: () => void
  show: () => void
  focus: () => void
  webContents: { send: (...args: unknown[]) => void }
} {
  return {
    isDestroyed: vi.fn(() => false),
    isMinimized: vi.fn(() => false),
    restore: vi.fn(),
    show: vi.fn(),
    focus: vi.fn(),
    webContents: { send: vi.fn() },
    ...overrides
  }
}

describe('broadcastToAllWindows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends the channel and args to every non-destroyed window', () => {
    const win1 = makeWindow()
    const win2 = makeWindow()
    mocks.getAllWindows.mockReturnValue([win1, win2])

    broadcastToAllWindows('spotify-oauth:auth-url', 'https://example.com/auth')

    expect(win1.webContents.send).toHaveBeenCalledWith(
      'spotify-oauth:auth-url',
      'https://example.com/auth'
    )
    expect(win2.webContents.send).toHaveBeenCalledWith(
      'spotify-oauth:auth-url',
      'https://example.com/auth'
    )
  })

  it('skips destroyed windows', () => {
    const destroyed = makeWindow({ isDestroyed: vi.fn(() => true) })
    mocks.getAllWindows.mockReturnValue([destroyed])

    broadcastToAllWindows('youtube-oauth:auth-url', 'url')

    expect(destroyed.webContents.send).not.toHaveBeenCalled()
  })
})

describe('focusMainWindow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('restores a minimized window before showing and focusing it', () => {
    const minimized = makeWindow({ isMinimized: vi.fn(() => true) })
    mocks.getAllWindows.mockReturnValue([minimized])

    focusMainWindow()

    expect(minimized.restore).toHaveBeenCalled()
    expect(minimized.show).toHaveBeenCalled()
    expect(minimized.focus).toHaveBeenCalled()
  })

  it('shows and focuses a non-minimized window without restoring it', () => {
    const win = makeWindow()
    mocks.getAllWindows.mockReturnValue([win])

    focusMainWindow()

    expect(win.restore).not.toHaveBeenCalled()
    expect(win.show).toHaveBeenCalled()
    expect(win.focus).toHaveBeenCalled()
  })

  it('ignores destroyed windows entirely', () => {
    const destroyed = makeWindow({ isDestroyed: vi.fn(() => true) })
    mocks.getAllWindows.mockReturnValue([destroyed])

    focusMainWindow()

    expect(destroyed.show).not.toHaveBeenCalled()
    expect(destroyed.focus).not.toHaveBeenCalled()
    expect(destroyed.restore).not.toHaveBeenCalled()
  })
})
