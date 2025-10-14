/**
 * Normalizes unknown error inputs into a human-readable string.
 *
 * @param error - Unknown error value thrown or returned from an async operation.
 * @param fallback - Message to use when the error has no descriptive text.
 * @returns A string representation suitable for user-facing error messaging.
 */
export function getErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === 'string') {
    const trimmed = error.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  if (error && typeof error === 'object') {
    try {
      return JSON.stringify(error);
    } catch {
      return fallback;
    }
  }

  return fallback;
}
