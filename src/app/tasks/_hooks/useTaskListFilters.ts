import React, {useState, useCallback} from 'react'
import {useRouter} from 'next/navigation'
import {type TaskListFilters} from '@/app/actions/taskListActions'
import {type TaskStatusDropdownOption} from '@/app/actions/taskStatusActions'
import {type TaskTypeDropdownOption} from '@/app/actions/taskTypeActions'
import {type UserDropDownOption} from '@/app/actions/userActions'
import {type DepartmentDropdownOption} from '@/app/actions/departmentActions'

type FilterSelectOption = {value: number; label: string}

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

interface UseTaskListFiltersOptions {
    initialFilters: TaskListFilters
    initialStatusOptions: TaskStatusDropdownOption[]
    initialTaskTypeOptions: TaskTypeDropdownOption[]
    initialAssigneeOptions: UserDropDownOption[]
    initialDepartmentOptions: DepartmentDropdownOption[]
}

export function useTaskListFilters({
    initialFilters,
    initialStatusOptions,
    initialTaskTypeOptions,
    initialAssigneeOptions,
    initialDepartmentOptions,
}: UseTaskListFiltersOptions) {
    const router = useRouter()
    const [filters, setFilters] = useState<TaskListFilters>(initialFilters)
    const isInitialMount = React.useRef(true)

    const statusOptions = React.useMemo(() => ensureSelectedOption(
        initialStatusOptions,
        filters.statusID,
        (id) => `Status ${id}`,
    ), [initialStatusOptions, filters.statusID])

    const taskTypeOptions = React.useMemo(() => ensureSelectedOption(
        initialTaskTypeOptions,
        filters.taskTypeID,
        (id) => `TaskType ${id}`,
    ), [initialTaskTypeOptions, filters.taskTypeID])

    const assignedToOptions = React.useMemo(() => ensureSelectedOption(
        initialAssigneeOptions,
        filters.assignedToID,
        (id) => `AssignedTo ${id}`,
    ), [initialAssigneeOptions, filters.assignedToID])

    const departmentOptions = React.useMemo(() => ensureSelectedOption(
        initialDepartmentOptions,
        filters.departmentID,
        (id) => `Department ${id}`,
    ), [initialDepartmentOptions, filters.departmentID])

    // Update URL when filters change (triggers server-side refetch)
    React.useEffect(() => {
        // Skip pushing URL on initial mount (server already has correct URL)
        if (isInitialMount.current) {
            isInitialMount.current = false
            return
        }

        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.set(key, value.toString())
            } else {
                params.delete(key)
            }
        })

        router.push(`/tasks?${params.toString()}`, {scroll: false})
    }, [filters, router])

    const handleFilterChange = useCallback((key: keyof TaskListFilters, value: string | number | undefined) => {
        setFilters((prevFilters) => {
            if (key !== 'page') {
                return {
                    ...prevFilters,
                    [key]: value,
                    page: 1,
                }
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

    const handleStatusSelectChange = useCallback((value: string) => {
        if (value === 'activeNotWaiting') {
            setFilters((prevFilters) => ({...prevFilters, statusID: undefined, statusPreset: 'activeNotWaiting', page: 1}))
            return
        }
        if (value === '') {
            setFilters((prevFilters) => ({...prevFilters, statusID: undefined, statusPreset: undefined, page: 1}))
            return
        }
        const parsedStatusId = parseInt(value, 10)
        setFilters((prevFilters) => ({
            ...prevFilters,
            statusID: Number.isNaN(parsedStatusId) ? undefined : parsedStatusId,
            statusPreset: undefined,
            page: 1,
        }))
    }, [])

    const handleTaskTypeSelectChange = useCallback((value: string) => {
        if (value === '') {
            setFilters((prevFilters) => ({...prevFilters, taskTypeID: undefined, page: 1}))
            return
        }
        const parsedTaskTypeId = parseInt(value, 10)
        setFilters((prevFilters) => ({
            ...prevFilters,
            taskTypeID: Number.isNaN(parsedTaskTypeId) ? undefined : parsedTaskTypeId,
            page: 1,
        }))
    }, [])

    const handleAssignedToSelectChange = useCallback((value: string) => {
        if (value === 'unAssigned') {
            setFilters((prevFilters) => ({...prevFilters, assignedToID: undefined, unassignedPreset: 'unAssigned', page: 1}))
            return
        }
        if (value === '') {
            setFilters((prevFilters) => ({...prevFilters, assignedToID: undefined, unassignedPreset: undefined, page: 1}))
            return
        }
        const parsedAssignedToId = parseInt(value, 10)
        setFilters((prevFilters) => ({
            ...prevFilters,
            assignedToID: Number.isNaN(parsedAssignedToId) ? undefined : parsedAssignedToId,
            unassignedPreset: undefined,
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

    const resetStatusFilter = useCallback(() => handleStatusSelectChange(''), [handleStatusSelectChange])

    const resetTaskTypeFilter = useCallback(() => handleTaskTypeSelectChange(''), [handleTaskTypeSelectChange])

    const resetAssignedToFilter = useCallback(() => handleAssignedToSelectChange(''), [handleAssignedToSelectChange])

    const resetDepartmentFilter = useCallback(() => handleDepartmentSelectChange(''), [handleDepartmentSelectChange])

    return {
        filters,
        statusOptions,
        taskTypeOptions,
        assignedToOptions,
        departmentOptions,
        handleFilterChange,
        handleSortChange,
        handleStatusSelectChange,
        handleTaskTypeSelectChange,
        handleAssignedToSelectChange,
        handleDepartmentSelectChange,
        resetStatusFilter,
        resetTaskTypeFilter,
        resetAssignedToFilter,
        resetDepartmentFilter,
    }
}

