'use client'

import {useSite} from './SiteProvider'

export function useCurrentSite(): string {
  const {siteID} = useSite()
  return siteID
}


