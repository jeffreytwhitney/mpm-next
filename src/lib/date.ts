/**
 * Date Utility Module
 *
 * Provides shared date parsing and manipulation utilities used across server and client.
 * Handles:
 * - Flexible date parsing from strings, numbers, or Date objects
 * - Normalization to start-of-day for date-only comparisons
 * - Null-safe handling of invalid dates
 */
export function parseDateValue(value: unknown): Date | null {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsedDate = new Date(value)
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
  }

  return null
}

export function startOfDay(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

