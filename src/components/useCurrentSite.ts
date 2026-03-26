'use client'

/**
 * AUTO-GENERATED MODULE DOC
 * Shared UI component module for 'useCurrentSite'.
 */
import {useSite} from './SiteProvider'

export function useCurrentSite(): string {
  const {siteID} = useSite()
  return siteID
}


