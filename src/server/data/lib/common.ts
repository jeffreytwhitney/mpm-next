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