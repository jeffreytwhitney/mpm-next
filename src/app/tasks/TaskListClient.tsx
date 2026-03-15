'use client'

import React, {useState, useCallback} from 'react'
import {useRouter} from 'next/navigation'
import {DataTable} from '@/components/DataTable'
import {type TaskListFilters, type TaskListItem} from '@/app/actions/taskListActions'
import DebouncedInput from '@/components/DebouncedInput'
import {taskColumns} from "@/components/columnDefs/TaskListColumns"
import {TaskStatusDropdownOption} from "@/app/actions/taskStatusActions";
import {getTaskRowStateFlags} from '@/lib/taskRowState'
import {TaskTypeDropdownOption} from "@/app/actions/taskTypeActions";
import {UserDropDownOption} from "@/app/actions/userActions";
import {DepartmentDropdownOption} from '@/app/actions/departmentActions'

const ROW_HIGHLIGHT_OPACITY = 0.1

function makeRowHighlight(red: number, green: number, blue: number): React.CSSProperties {
    return {
        backgroundColor: `rgba(${red}, ${green}, ${blue}, ${ROW_HIGHLIGHT_OPACITY})`,
    }
}

function getTaskRowStyle(task: TaskListItem): React.CSSProperties | undefined {
    const {isOverdue, isStarted, isWaiting, startedMoreThanMonthAgo} = getTaskRowStateFlags(task)

    if (isOverdue) {
        return makeRowHighlight(239, 68, 68)
    }

    if (isStarted && startedMoreThanMonthAgo) {
        return makeRowHighlight(249, 115, 22)
    }

    if (isStarted) {
        return makeRowHighlight(22, 163, 74)
    }

    if (isWaiting) {
        return makeRowHighlight(37, 99, 235)
    }

    return undefined
}

interface TaskListClientProps {
    initialTasks: TaskListItem[]
    initialFilters: TaskListFilters
    initialStatusOptions: TaskStatusDropdownOption[]
    initialTaskTypeOptions: TaskTypeDropdownOption[]
    initialAssigneeOptions: UserDropDownOption[]
    initialDepartmentOptions: DepartmentDropdownOption[]
}

type TextFilterKey = 'ticketNumber' | 'taskName' | 'projectName'

const FILTER_CONTROL_CLASS = 'box-border h-[16.5px] w-full border rounded-sm text-[11px] leading-none bg-[#F1EB9C] font-semibold'
const TEXT_FILTER_CLASS = `${FILTER_CONTROL_CLASS} px-0 py-0`
const SELECT_FILTER_CLASS = `${FILTER_CONTROL_CLASS} px-2 py-0`
const FILTER_RESET_TITLE = 'Double-click to reset this filter'

export function TaskListClient({initialTasks, initialFilters, initialStatusOptions, initialTaskTypeOptions, initialAssigneeOptions, initialDepartmentOptions}: TaskListClientProps) {
    const router = useRouter()
    const [filters, setFilters] = useState<TaskListFilters>(initialFilters)
    const isInitialMount = React.useRef(true)


    const statusOptions = React.useMemo(() => {
        if (filters.statusID === undefined) {
            return initialStatusOptions
        }

        const hasSelected = initialStatusOptions.some((option) => option.value === filters.statusID)
        if (hasSelected) {
            return initialStatusOptions
        }

        return [...initialStatusOptions, {value: filters.statusID, label: `Status ${filters.statusID}`}]
    }, [initialStatusOptions, filters.statusID])

    const taskTypeOptions = React.useMemo(() => {
        if (filters.taskTypeID === undefined) {
            return initialTaskTypeOptions
        }

        const hasSelected = initialTaskTypeOptions.some((option) => option.value === filters.taskTypeID)
        if (hasSelected) {
            return initialTaskTypeOptions
        }

        return [...initialTaskTypeOptions, {value: filters.taskTypeID, label: `TaskType ${filters.taskTypeID}`}]
    }, [initialTaskTypeOptions, filters.taskTypeID])

    const assignedToOptions = React.useMemo(() => {
        if (filters.assignedToID === undefined) {
            return initialAssigneeOptions
        }

        const hasSelected = initialAssigneeOptions.some((option) => option.value === filters.assignedToID)
        if (hasSelected) {
            return initialAssigneeOptions
        }

        return [...initialAssigneeOptions, {value: filters.assignedToID, label: `AssignedTo ${filters.assignedToID}`}]
    }, [initialAssigneeOptions, filters.assignedToID])

    const departmentOptions = React.useMemo(() => {
        if (filters.departmentID === undefined) {
            return initialDepartmentOptions
        }

        const hasSelected = initialDepartmentOptions.some((option) => option.value === filters.departmentID)
        if (hasSelected) {
            return initialDepartmentOptions
        }

        return [...initialDepartmentOptions, {value: filters.departmentID, label: `Department ${filters.departmentID}`}]
    }, [initialDepartmentOptions, filters.departmentID])


    // Update URL when filters, sort, or page change (triggers server-side refetch)
    React.useEffect(() => {
        // Skip pushing URL on initial mount (server already has correct URL)
        if (isInitialMount.current) {
            isInitialMount.current = false
            return
        }

        const params = new URLSearchParams()

        // Update URL params based on current filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.set(key, value.toString())
            } else {
                params.delete(key)
            }
        })

        // Navigate to new URL (this triggers server component to re-render)
        router.push(`/tasks?${params.toString()}`, {scroll: false})
    }, [filters, router])

    // Handle filter changes - update specific filter keys only
    const handleFilterChange = useCallback((key: keyof TaskListFilters, value: string | number | undefined) => {
        setFilters((prevFilters) => {
            // Reset to page 1 when filters change
            if (key !== 'page') {
                return {
                    ...prevFilters,
                    [key]: value,
                    page: 1, // Reset pagination
                }
            }
            return {
                ...prevFilters,
                [key]: value as number | undefined,
            }
        })
    }, [])

    // Handle sort column click
    const handleSortChange = useCallback((column: string, direction: 'asc' | 'desc') => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            sortBy: column,
            sortOrder: direction,
            page: 1, // Reset to first page
        }))
    }, [])

    const textFilterColumns: Record<string, {filterKey: TextFilterKey; value: string | undefined}> = {
        TicketNumber: {filterKey: 'ticketNumber', value: filters.ticketNumber},
        TaskName: {filterKey: 'taskName', value: filters.taskName},
        ProjectName: {filterKey: 'projectName', value: filters.projectName},
    }

    const renderTextFilter = useCallback((filterKey: TextFilterKey, value: string | undefined) => (
        <DebouncedInput
            type="text"
            placeholder="Filter..."
            value={value ?? ''}
            onChange={(nextValue) =>
                handleFilterChange(filterKey, nextValue ? nextValue.toString() : undefined)
            }
            className={TEXT_FILTER_CLASS}
            debounce={300}
            title={FILTER_RESET_TITLE}
            onDoubleClick={() => handleFilterChange(filterKey, undefined)}
        />
    ), [handleFilterChange])

    const handleStatusSelectChange = useCallback((value: string) => {
        if (value === 'activeNotWaiting') {
            setFilters((prevFilters) => ({
                ...prevFilters,
                statusID: undefined,
                statusPreset: 'activeNotWaiting',
                page: 1,
            }))
            return
        }

        if (value === '') {
            setFilters((prevFilters) => ({
                ...prevFilters,
                statusID: undefined,
                statusPreset: undefined,
                page: 1,
            }))
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
            setFilters((prevFilters) => ({
                ...prevFilters,
                taskTypeID: undefined,
                page: 1,
            }))
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
            setFilters((prevFilters) => ({
                ...prevFilters,
                assignedToID: undefined,
                unassignedPreset: 'unAssigned',
                page: 1,
            }))
            return
        }

        if (value === '') {
            setFilters((prevFilters) => ({
                ...prevFilters,
                assignedToID: undefined,
                unassignedPreset: undefined,
                page: 1,
            }))
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
            setFilters((prevFilters) => ({
                ...prevFilters,
                departmentID: undefined,
                page: 1,
            }))
            return
        }

        const parsedDepartmentId = parseInt(value, 10)
        setFilters((prevFilters) => ({
            ...prevFilters,
            departmentID: Number.isNaN(parsedDepartmentId) ? undefined : parsedDepartmentId,
            page: 1,
        }))
    }, [])

    const resetStatusFilter = useCallback(() => {
        handleStatusSelectChange('')
    }, [handleStatusSelectChange])

    const resetTaskTypeFilter = useCallback(() => {
        handleTaskTypeSelectChange('')
    }, [handleTaskTypeSelectChange])

    const resetAssignedToFilter = useCallback(() => {
        handleAssignedToSelectChange('')
    }, [handleAssignedToSelectChange])

    const resetDepartmentFilter = useCallback(() => {
        handleDepartmentSelectChange('')
    }, [handleDepartmentSelectChange])

    const renderStatusFilter = useCallback(() => {
        const statusSelectValue = filters.statusID !== undefined
            ? filters.statusID.toString()
            : (filters.statusPreset ?? '')

        return (
            <select
                value={statusSelectValue}
                onChange={(event) => handleStatusSelectChange(event.target.value)}
                className={SELECT_FILTER_CLASS}
                title={FILTER_RESET_TITLE}
                onDoubleClick={resetStatusFilter}
            >
                <option value="">Active</option>
                <option value="activeNotWaiting">Not Waiting</option>
                {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        )
    }, [filters.statusID, filters.statusPreset, handleStatusSelectChange, resetStatusFilter, statusOptions])

    const renderTaskTypeFilter = useCallback(() => {
        const taskTypeSelectValue = filters.taskTypeID !== undefined
            ? filters.taskTypeID.toString()
            : ''

        return (
            <select
                value={taskTypeSelectValue}
                onChange={(event) => handleTaskTypeSelectChange(event.target.value)}
                className={SELECT_FILTER_CLASS}
                title={FILTER_RESET_TITLE}
                onDoubleClick={resetTaskTypeFilter}
            >
                <option value="">All</option>
                {taskTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        )
    }, [filters.taskTypeID, handleTaskTypeSelectChange, resetTaskTypeFilter, taskTypeOptions])

    const renderAssignedToFilter = useCallback(() => {
        const assignedToSelectValue = filters.assignedToID !== undefined
            ? filters.assignedToID.toString()
            : (filters.unassignedPreset ?? '')

        return (
            <select
                value={assignedToSelectValue}
                onChange={(event) => handleAssignedToSelectChange(event.target.value)}
                className={SELECT_FILTER_CLASS}
                title={FILTER_RESET_TITLE}
                onDoubleClick={resetAssignedToFilter}
            >
                <option value=""></option>
                <option value="unAssigned">Unassigned</option>
                {assignedToOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        )
    }, [filters.assignedToID, filters.unassignedPreset, handleAssignedToSelectChange, resetAssignedToFilter, assignedToOptions])

    const renderDepartmentFilter = useCallback(() => {
        const departmentSelectValue = filters.departmentID !== undefined
            ? filters.departmentID.toString()
            : ''

        return (
            <select
                value={departmentSelectValue}
                onChange={(event) => handleDepartmentSelectChange(event.target.value)}
                className={SELECT_FILTER_CLASS}
                title={FILTER_RESET_TITLE}
                onDoubleClick={resetDepartmentFilter}
            >
                <option value="">All</option>
                {departmentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        )
    }, [filters.departmentID, handleDepartmentSelectChange, resetDepartmentFilter, departmentOptions])

    const renderHeaderFilter = (columnId: string) => {
        const textFilter = textFilterColumns[columnId]
        if (textFilter) {
            return renderTextFilter(textFilter.filterKey, textFilter.value)
        }

        const selectFilterRenderers: Record<string, () => React.ReactNode> = {
            Status: renderStatusFilter,
            TaskType: renderTaskTypeFilter,
            AssignedToName: renderAssignedToFilter,
            DepartmentName: renderDepartmentFilter,
        }

        const selectFilterRenderer = selectFilterRenderers[columnId]
        return selectFilterRenderer ? selectFilterRenderer() : null
    }

    return (
        <div className="mx-auto py-4 px-3">
            {/* Data Table */}
            <DataTable
                columns={taskColumns}
                data={initialTasks}
                onSortChange={handleSortChange}
                renderHeaderFilter={renderHeaderFilter}
                getRowStyle={getTaskRowStyle}
            />
        </div>
    )
}
