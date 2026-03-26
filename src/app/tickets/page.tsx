/**
 * AUTO-GENERATED MODULE DOC
 * App Router page module for '/tickets'.
 */
import {TicketListClient} from './TicketListClient'
import {getTicketList, parseTicketListFilters} from '@/server/data/queries/ticketList'
import type {TicketListSearchParams} from '@/server/data/queries/ticketList'
import {getTopLevelDepartmentDropdownOptions} from '@/server/data/department'
import {getQualityEngineerDropdownOptionsBySite} from '@/server/data/user'
import {cookies} from 'next/headers'
import {resolveSiteID, SITE_COOKIE_NAME} from '@/lib/site'

/** Search params accepted by the tickets list route. */
interface TicketListPageProps {
    searchParams: TicketListSearchParams
}

/**
 * Server-rendered tickets list route.
 *
 * Resolves site-aware filters and preloads list/dropdown data before
 * handing control to the interactive client table.
 */
export default async function TicketsPage({searchParams}: TicketListPageProps) {
    const params = await searchParams
    const cookieStore = await cookies()
    const cookieSiteID = cookieStore.get(SITE_COOKIE_NAME)?.value
    const defaultSiteID = resolveSiteID(undefined, cookieSiteID)
    const filters = parseTicketListFilters(params, defaultSiteID)
    const siteID = Number(filters.siteID) || 1

    const [{tasks: tickets, totalCount}, departmentOptions, qualityEngineerOptions, submittorOptions] = await Promise.all([
        getTicketList(filters),
        getTopLevelDepartmentDropdownOptions(siteID),
        getQualityEngineerDropdownOptionsBySite(siteID),
        getQualityEngineerDropdownOptionsBySite(siteID),
    ])

    return (
        <TicketListClient
            initialTickets={tickets}
            initialFilters={filters}
            initialDepartmentOptions={departmentOptions}
            initialQualityEngineerOptions={qualityEngineerOptions}
            initialSubmittorOptions={submittorOptions}
            totalCount={totalCount}
        />
    )
}

