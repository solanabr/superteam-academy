"use server"

type RetryOptions = {
  attempts?: number
  delayMs?: number
}

function isRetryableDbError(error: unknown) {
  if (!error || typeof error !== "object") return false
  const anyError = error as { code?: string; message?: string; cause?: unknown }
  const code = anyError.code
  const message = anyError.message ?? ""

  return (
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "ECONNREFUSED" ||
    code === "57P01" || // admin shutdown
    code === "57P02" || // crash shutdown
    message.includes("ECONNRESET") ||
    message.includes("Connection terminated") ||
    message.includes("terminating connection")
  )
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function withDbRetry<T>(
  fn: () => Promise<T>,
  { attempts = 2, delayMs = 150 }: RetryOptions = {}
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (!isRetryableDbError(error) || attempt === attempts) {
        throw error
      }
      await sleep(delayMs)
    }
  }

  throw lastError
}
