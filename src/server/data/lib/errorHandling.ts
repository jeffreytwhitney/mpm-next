/**
 * Unified error handling for server data operations.
 * Logs errors and throws user-friendly messages.
 */

export function handleDataError(operation: string, error: unknown, userMessage: string): never {
  console.error(`Error ${operation}:`, error)
  throw new Error(userMessage)
}

/**
 * Wraps a data operation with consistent error handling.
 * Usage:
 *   return await withErrorHandling(
 *     () => prisma.table.findFirst(...),
 *     'fetching item',
 *     'Failed to fetch item'
 *   )
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  userMessage: string,
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    handleDataError(context, error, userMessage)
  }
}

