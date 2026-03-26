/**
 * Route Parameter Parsing Utility Module
 *
 * Provides safe parsing of dynamic route parameters with fail-fast behavior.
 * Validates that parameters are positive integers and returns 404 responses
 * for invalid inputs, keeping page logic linear and error-free.
 */
import { notFound } from 'next/navigation'

type AwaitableRouteParams = Promise<{
  [key: string]: string | string[] | undefined
}>

/**
 * Parses a route segment value (default key `id`) as a positive integer.
 *
 * Calls `notFound()` when the param is missing, non-numeric, non-integer,
 * or not greater than zero so page modules can stay linear and fail fast.
 */
export async function parsePositiveIntParamOrNotFound(
  params: AwaitableRouteParams,
  paramKey = 'id'
): Promise<number> {
  const rawParam = (await params)[paramKey]
  const paramValue = Array.isArray(rawParam) ? rawParam[0] : rawParam
  const parsed = Number(paramValue)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    notFound()
  }

  return parsed
}
