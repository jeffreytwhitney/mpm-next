'use server'

import {cookies} from 'next/headers'
import {SITE_COOKIE_NAME, parseSiteID} from '@/lib/site'

export async function setCurrentSiteCookie(siteID: string): Promise<void> {
  const parsedSiteID = parseSiteID(siteID)

  if (!parsedSiteID) {
    throw new Error('Invalid site ID')
  }

  const cookieStore = await cookies()
  cookieStore.set({
    name: SITE_COOKIE_NAME,
    value: parsedSiteID,
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
}

