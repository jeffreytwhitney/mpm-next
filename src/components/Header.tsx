'use client'

import React from 'react'
import {SITE_OPTIONS} from '@/lib/site'
import {useCurrentSite} from './useCurrentSite'

export function Header() {
  const siteID = useCurrentSite()
  const siteName = SITE_OPTIONS.find((site) => site.id === siteID)?.label ?? 'Unknown Site'

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">Task List</h1>
        <span className="text-sm text-gray-600">{siteName}</span>
      </div>
    </header>
  )
}



