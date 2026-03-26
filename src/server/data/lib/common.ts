/**
 * Common Data Parsing Utilities Module
 *
 * Provides reusable parsing helpers for form input and query parameters including:
 * - Optional integer parsing with null-safe handling
 * - Positive integer parsing with default fallback values
 *
 * Used throughout server actions and data access layers for consistent input normalization.
 */
export const parseOptionalInt = (value?: string): number | undefined => {
    if (!value) {
        return undefined
    }
    const parsed = parseInt(value, 10)
    return Number.isNaN(parsed) ? undefined : parsed
}


export const parsePositiveIntOrDefault = (value: string | undefined, defaultValue: number): number => {
    const parsed = parseOptionalInt(value)
    return parsed !== undefined && parsed > 0 ? parsed : defaultValue
}