/**
 * AUTO-GENERATED MODULE DOC
 * Shared utility module used across server and client code.
 */
export const SITE_COOKIE_NAME = 'mpm_site_id'

/** Supported site filter options surfaced in app UI controls. */
export const SITE_OPTIONS = [
  { id: '1', label: 'Coon Rapids' },
  { id: '2', label: 'Anoka' },
] as const

const validSiteIDs = new Set<string>(SITE_OPTIONS.map((site) => site.id))

/**
 * Normalizes an arbitrary site value to a known site id.
 */
export function parseSiteID(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  return validSiteIDs.has(value) ? value : undefined
}

/**
 * Resolves the active site using URL value first, then cookie fallback,
 * and finally the default site (`1`).
 */
export function resolveSiteID(urlSiteID?: string, cookieSiteID?: string): string {
  return parseSiteID(urlSiteID) ?? parseSiteID(cookieSiteID) ?? '1'
}

