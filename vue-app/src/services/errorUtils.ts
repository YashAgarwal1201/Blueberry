/**
 * Axios errors expose `response.data.error`, plain Errors expose `message`.
 * This utility narrows `unknown` catch values into a safe string.
 */

interface ApiErrorResponse {
  error?: string
  message?: string
}

interface AxiosLikeError {
  response?: {
    status?: number
    data?: ApiErrorResponse
  }
  message?: string
}

function isAxiosLikeError(err: unknown): err is AxiosLikeError {
  return typeof err === 'object' && err !== null && 'message' in err
}

/**
 * Returns a human-readable error message from an unknown catch value.
 * @param err   - The caught value (always `unknown` in strict TS)
 * @param fallback - Shown when no message can be extracted
 */
export function getErrorMessage(err: unknown, fallback = 'An unexpected error occurred'): string {
  if (isAxiosLikeError(err)) {
    return err.response?.data?.error ?? err.response?.data?.message ?? err.message ?? fallback
  }
  if (err instanceof Error) return err.message
  return fallback
}

/**
 * Returns the HTTP status code from an Axios-like error, or undefined.
 */
export function getErrorStatus(err: unknown): number | undefined {
  if (isAxiosLikeError(err)) return err.response?.status
  return undefined
}
