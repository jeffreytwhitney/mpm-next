'use client'

import React from 'react'

interface SiteContextValue {
  siteID: string
  setSiteID: (siteID: string) => void
}

const SiteContext = React.createContext<SiteContextValue | undefined>(undefined)

interface SiteProviderProps {
  children: React.ReactNode
  initialSiteID: string
}

export function SiteProvider({ children, initialSiteID }: SiteProviderProps) {
  const [siteID, setSiteID] = React.useState(initialSiteID)

  const value = React.useMemo(
    () => ({
      siteID,
      setSiteID,
    }),
    [siteID],
  )

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite() {
  const context = React.useContext(SiteContext)

  if (!context) {
    throw new Error('useSite must be used within a SiteProvider')
  }

  return context
}


