export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

interface IpcTryOptions {
  onError?: (err: unknown) => void
  formatError?: (err: unknown) => string
}

// Wraps an ipcMain.handle body in the repeated
// `try { ... } catch (e) { return { success: false, error } }` shape,
// merging a successful result into `{ success: true }`.
export async function ipcTry<T extends object>(
  fn: () => T | Promise<T>,
  options?: IpcTryOptions
): Promise<({ success: true } & T) | { success: false; error: string }> {
  try {
    const result = await fn()
    return { success: true, ...result }
  } catch (e) {
    options?.onError?.(e)
    const error = options?.formatError ? options.formatError(e) : getErrorMessage(e)
    return { success: false, error }
  }
}
