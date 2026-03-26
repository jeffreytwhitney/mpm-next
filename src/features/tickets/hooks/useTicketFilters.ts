'use client'

/**
 * AUTO-GENERATED MODULE DOC
 * Feature module for 'tickets' domain behavior.
 */
import React, {useCallback, useState} from 'react'
import {type TicketListFilters} from '@/server/data/queries/ticketList'
import {type UserDropDownOption} from '@/server/data/user'
import {type DepartmentDropdownOption} from '@/server/data/department'

type FilterSelectOption = { value: number; label: string }

function ensureSelectedOption<T extends FilterSelectOption>(
    options: readonly T[],
    selectedValue: number | undefined,
    fallbackLabel: (id: number) => string,
): T[] {
    if (selectedValue === undefined) return [...options]
    const hasSelected = options.some((option) => option.value === selectedValue)
    if (hasSelected) return [...options]
    return [...options, {value: selectedValue, label: fallbackLabel(selectedValue)} as T]
}

interface UseTaskFiltersOptions {
    initialFilters: TicketListFilters
    initialDepartmentOptions: DepartmentDropdownOption[]
    initialQualityEngineerOptions: UserDropDownOption[]
    initialSubmittorOptions: UserDropDownOption[]
    onFiltersChanged?: (filters: TicketListFilters) => void
}

export function useTicketFilters({   initialFilters,
                                     initialDepartmentOptions,
                                     initialQualityEngineerOptions,
                                     initialSubmittorOptions,
                                     onFiltersChanged,
                                 }: UseTaskFiltersOptions) {
    const [filters, setFilters] = useState<TicketListFilters>(initialFilters)
    const isInitialMount = React.useRef(true)

    const qualityEngineerOptions = React.useMemo(() => ensureSelectedOption(
        initialQualityEngineerOptions,
        filters.qualityEngineerID,
        (id) => `QualityEngineer ${id}`,
    ), [initialQualityEngineerOptions, filters.qualityEngineerID])

    const departmentOptions = React.useMemo(() => ensureSelectedOption(
        initialDepartmentOptions,
        filters.departmentID,
        (id) => `Department ${id}`,
    ), [initialDepartmentOptions, filters.departmentID])

    const submittorOptions = React.useMemo(() => ensureSelectedOption(
        initialSubmittorOptions,
        filters.submittorID,
        (id) => `Submittor ${id}`,
    ), [initialSubmittorOptions, filters.submittorID])


    React.useEffect(() => {
        if (!onFiltersChanged) return

        // Skip callback on initial mount because SSR already rendered the first filter state.
        if (isInitialMount.current) {
            isInitialMount.current = false
            return
        }

        onFiltersChanged(filters)
    }, [filters, onFiltersChanged])

    const handleFilterChange = useCallback((key: keyof TicketListFilters, value: string | number | undefined) => {
        setFilters((prevFilters) => {
            if (key !== 'page') {
                const nextPage = 1
                if (prevFilters[key] === value && prevFilters.page === nextPage) {
                    return prevFilters
                }

                return {
                    ...prevFilters,
                    [key]: value,
                    page: nextPage,
                }
            }

            if (prevFilters[key] === value) {
                return prevFilters
            }

            return {
                ...prevFilters,
                [key]: value as number | undefined,
            }
        })
    }, [])

    const handleSortChange = useCallback((column: string, direction: 'asc' | 'desc') => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            sortBy: column,
            sortOrder: direction,
            page: 1,
        }))
    }, [])

    const handleQualityEngineerSelectChange = useCallback((value: string) => {
        if (value === '') {
            setFilters((prevFilters) => ({...prevFilters, qualityEngineerID: undefined, page: 1}))
            return
        }
        const parsedQEId = parseInt(value, 10)
        setFilters((prevFilters) => ({
            ...prevFilters,
            qualityEngineerID: Number.isNaN(parsedQEId) ? undefined : parsedQEId,
            page: 1,
        }))
    }, [])

    const handleSubmittorSelectChange = useCallback((value: string) => {
        if (value === '') {
            setFilters((prevFilters) => ({...prevFilters, submittorID: undefined, page: 1}))
            return
        }
        const parsedSubmittorId = parseInt(value, 10)
        setFilters((prevFilters) => ({
            ...prevFilters,
            submittorID: Number.isNaN(parsedSubmittorId) ? undefined : parsedSubmittorId,
            page: 1,
        }))
    }, [])

    const handleDepartmentSelectChange = useCallback((value: string) => {
        if (value === '') {
            setFilters((prevFilters) => ({...prevFilters, departmentID: undefined, page: 1}))
            return
        }
        const parsedDepartmentId = parseInt(value, 10)
        setFilters((prevFilters) => ({
            ...prevFilters,
            departmentID: Number.isNaN(parsedDepartmentId) ? undefined : parsedDepartmentId,
            page: 1,
        }))
    }, [])

    const resetQualityEngineerFilter = useCallback(() => handleQualityEngineerSelectChange(''), [handleQualityEngineerSelectChange])

    const resetSubmittorFilter = useCallback(() => handleSubmittorSelectChange(''), [handleSubmittorSelectChange])

    const resetDepartmentFilter = useCallback(() => handleDepartmentSelectChange(''), [handleDepartmentSelectChange])

    return {
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
    }
}

