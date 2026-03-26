'use client'

/**
 * AUTO-GENERATED MODULE DOC
 * App Router module for route composition and rendering.
 */
import React, {useCallback} from 'react'
import {usePathname, useRouter} from 'next/navigation'
import {DataTable} from '@/components/DataTable'
import {type TicketListFilters, type TicketListItem} from '@/server/data/queries/ticketList'
import DebouncedInput from '@/components/DebouncedInput'
import {ticketColumns} from '@/components/columnDefs/TicketListColumns'

import {type UserDropDownOption} from '@/server/data/user'
import {type DepartmentDropdownOption} from '@/server/data/department'
import {PAGE_SIZE, TEXT_FILTER_CLASS, FILTER_RESET_TITLE} from '@/lib/filterConstants'
import {Pagination} from '@/components/Pagination'
import {useTicketFilters} from '@/features/tickets/hooks/useTicketFilters'
import {QualityEngineerFilter, DepartmentFilter, SubmittorFilter} from '@/features/tickets/components/TicketListFilterControls'

type TextFilterKey = 'ticketNumber' | 'ticketName'

interface TicketListClientProps {
    initialTickets: TicketListItem[]
    initialFilters: TicketListFilters
    initialDepartmentOptions: DepartmentDropdownOption[]
    initialQualityEngineerOptions: UserDropDownOption[]
    initialSubmittorOptions: UserDropDownOption[]
    totalCount: number
}

export function TicketListClient({initialTickets, initialFilters, initialDepartmentOptions, initialQualityEngineerOptions, initialSubmittorOptions, totalCount}: TicketListClientProps) {
    const router = useRouter()
    const pathname = usePathname()
    const lastNavigatedHrefRef = React.useRef<string | null>(null)

    const handleFiltersChanged = useCallback((nextFilters: TicketListFilters) => {
        if (pathname !== '/tickets') {
            return
        }

        const params = new URLSearchParams()
        Object.entries(nextFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.set(key, value.toString())
            } else {
                params.delete(key)
            }
        })

        const queryString = params.toString()
        const href = queryString ? `/tickets?${queryString}` : '/tickets'
        if (lastNavigatedHrefRef.current === href) {
            return
        }

        lastNavigatedHrefRef.current = href
        router.replace(href, {scroll: false})
    }, [pathname, router])

    const {
        filters,
        qualityEngineerOptions,
        submittorOptions,
        departmentOptions,
        handleFilterChange,
        handleSortChange,
        handleSubmittorSelectChange,
        handleQualityEngineerSelectChange,
        handleDepartmentSelectChange,
        resetQualityEngineerFilter,
        resetSubmittorFilter,
        resetDepartmentFilter,
    } = useTicketFilters({
        initialFilters,
        initialDepartmentOptions,
        initialQualityEngineerOptions,
        initialSubmittorOptions,
        onFiltersChanged: handleFiltersChanged,
    })

    const textFilterColumns: Record<string, {filterKey: TextFilterKey; value: string | undefined}> = {
        TicketNumber: {filterKey: 'ticketNumber', value: filters.ticketNumber},
        ProjectName: {filterKey: 'ticketName', value: filters.ticketName},
    }

    const renderTextFilter = useCallback((filterKey: TextFilterKey, value: string | undefined) => (
        <DebouncedInput
            type="text"
            placeholder="Filter..."
            value={value ?? ''}
            onChange={(nextValue) => handleFilterChange(filterKey, nextValue ? nextValue.toString() : undefined)}
            className={TEXT_FILTER_CLASS}
            debounce={300}
            title={FILTER_RESET_TITLE}
            onDoubleClick={() => handleFilterChange(filterKey, undefined)}
        />
    ), [handleFilterChange])

    const renderHeaderFilter = (columnId: string) => {
        const textFilter = textFilterColumns[columnId]
        if (textFilter) return renderTextFilter(textFilter.filterKey, textFilter.value)

        switch (columnId) {
            case 'SecondaryOwnerName':
                return <QualityEngineerFilter qualityEngineerID={filters.qualityEngineerID} options={qualityEngineerOptions} onChange={handleQualityEngineerSelectChange} onReset={resetQualityEngineerFilter} />
            case 'InitiatorName':
                return <SubmittorFilter submittorID={filters.submittorID} options={submittorOptions} onChange={handleSubmittorSelectChange} onReset={resetSubmittorFilter} />
            case 'DepartmentName':
                return <DepartmentFilter departmentID={filters.departmentID} options={departmentOptions} onChange={handleDepartmentSelectChange} onReset={resetDepartmentFilter} />
            default:
                return null
        }
    }

    const currentPage = filters.page ?? 1
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

    return (
        <div className="mx-auto py-4 px-3">
            <DataTable
                columns={ticketColumns}
                data={initialTickets}
                onSortChange={handleSortChange}
                sortColumn={filters.sortBy ?? 'TicketNumber'}
                sortDirection={filters.sortOrder ?? 'asc'}
                renderHeaderFilter={renderHeaderFilter}
            />
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                onPageChange={(page) => handleFilterChange('page', page)}
            />
        </div>
    )
}
