export const SITE_COOKIE_NAME = 'mpm_site_id'

export const SITE_OPTIONS = [
  { id: '1', label: 'Coon Rapids' },
  { id: '2', label: 'Anoka' },
] as const

const validSiteIDs = new Set<string>(SITE_OPTIONS.map((site) => site.id))

export function parseSiteID(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  return validSiteIDs.has(value) ? value : undefined
}

export function resolveSiteID(urlSiteID?: string, cookieSiteID?: string): string {
  return parseSiteID(urlSiteID) ?? parseSiteID(cookieSiteID) ?? '1'
}

