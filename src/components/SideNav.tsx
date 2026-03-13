'use client'

import React from 'react'
import {usePathname, useRouter, useSearchParams} from 'next/navigation'
import {setCurrentSiteCookie} from '@/app/actions/siteActions'
import {SITE_OPTIONS, parseSiteID} from '@/lib/site'
import {useSite} from './SiteProvider'

export function SideNav() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const {siteID, setSiteID} = useSite()
    const [isPending, startTransition] = React.useTransition()

    React.useEffect(() => {
        const urlSiteID = parseSiteID(searchParams.get('siteID') ?? undefined)

        if (urlSiteID && urlSiteID !== siteID) {
            setSiteID(urlSiteID)
        }
    }, [searchParams, setSiteID, siteID])

    const handleSiteChange = React.useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        const nextSiteID = parseSiteID(event.target.value)

        if (!nextSiteID) {
            return
        }

        setSiteID(nextSiteID)

        startTransition(async () => {
            await setCurrentSiteCookie(nextSiteID)

            const params = new URLSearchParams(searchParams.toString())
            params.set('siteID', nextSiteID)
            params.set('page', '1')

            const queryString = params.toString()
            router.push(queryString ? `${pathname}?${queryString}` : pathname, {scroll: false})
        })
    }, [pathname, router, searchParams, setSiteID])

    return (
        <aside className="w-52 shrink-0 border-r border-gray-200 bg-gray-50">
            <div className="space-y-4 p-4">
                <label className="flex flex-col gap-2 text-sm text-gray-700" htmlFor="site-select">
                    <span className="font-medium">Site</span>
                    <select
                        id="site-select"
                        value={siteID}
                        onChange={handleSiteChange}
                        disabled={isPending}
                        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                        {SITE_OPTIONS.map((site) => (
                            <option key={site.id} value={site.id}>
                                {site.label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
        </aside>
    )
}


