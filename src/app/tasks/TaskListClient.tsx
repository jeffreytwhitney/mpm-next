'use client'

import React, {useState, useCallback} from 'react'
import {useRouter} from 'next/navigation'
import {DataTable} from '@/components/DataTable'
import {type TaskListFilters, type TaskListItem} from '@/app/actions/taskListActions'
import DebouncedInput from '@/components/DebouncedInput'
import {taskColumns} from "@/components/columnDefs/TaskListColumns"
import {TaskStatusDropdownOption} from "@/app/actions/taskStatusActions";
import {parseDateValue, startOfDay} from '@/lib/date'
import {TaskTypeDropdownOption} from "@/app/actions/taskTypeActions";
import {UserDropDownOption} from "@/app/actions/userActions";

function getTaskRowClassName(task: TaskListItem): string {
    const today = startOfDay(new Date())
    const oneMonthAgo = new Date(today)
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    const dueDate = parseDateValue(task.DueDate)
    const startedDate = parseDateValue(task.DateStarted)
    const statusID = task.StatusID

    const isOverdue = dueDate ? startOfDay(dueDate) <= today : false
    const isStarted = statusID === 2
    const isWaiting = statusID === 3
    const startedMoreThanMonthAgo = startedDate ? startOfDay(startedDate) < oneMonthAgo : false

    if (isOverdue) {
        return 'text-red-600'
    }

    if (isStarted && startedMoreThanMonthAgo) {
        return 'text-orange-500'
    }

    if (isStarted) {
        return 'text-green-600'
    }

    if (isWaiting) {
        return 'text-blue-600'
    }

    return ''
}

interface TaskListClientProps {
    initialTasks: TaskListItem[]
    initialFilters: TaskListFilters
    initialStatusOptions: TaskStatusDropdownOption[]
    initialTaskTypeOptions: TaskTypeDropdownOption[]
    initialAssigneeOptions: UserDropDownOption[]
}

export function TaskListClient({initialTasks, initialFilters, initialStatusOptions, initialTaskTypeOptions, initialAssigneeOptions}: TaskListClientProps) {
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

    const renderHeaderFilter = useCallback((columnId: string) => {
        switch (columnId) {
            case 'TicketNumber':
                return (
                    <DebouncedInput
                        type="text"
                        placeholder="Filter..."
                        value={filters.ticketNumber ?? ''}
                        onChange={(value) =>
                            handleFilterChange('ticketNumber', value ? value.toString() : undefined)
                        }
                        className="w-full border rounded-sm px-0 py-0 text-[11px] bg-[#F1EB9C] font-semibold"
                        debounce={300}
                    />
                )
            case 'TaskName':
                return (
                    <DebouncedInput
                        type="text"
                        placeholder="Filter..."
                        value={filters.taskName ?? ''}
                        onChange={(value) =>
                            handleFilterChange('taskName', value ? value.toString() : undefined)
                        }
                        className="w-full border rounded-sm px-0 py-0 text-[11px] bg-[#F1EB9C] font-semibold"
                        debounce={300}
                    />
                )
            case 'ProjectName':
                return (
                    <DebouncedInput
                        type="text"
                        placeholder="Filter..."
                        value={filters.projectName ?? ''}
                        onChange={(value) =>
                            handleFilterChange('projectName', value ? value.toString() : undefined)
                        }
                        className="w-full border rounded-sm px-0 py-0 text-[11px] bg-[#F1EB9C] font-semibold"
                        debounce={300}
                    />
                )
            case 'Status':
                const statusSelectValue = filters.statusID !== undefined
                    ? filters.statusID.toString()
                    : (filters.statusPreset ?? '')

                return (
                    <select
                        value={statusSelectValue}
                        onChange={(event) => {
                            const {value} = event.target

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
                        }}
                        className="w-full border rounded-sm px-2 py-0 text-[11px] bg-[#F1EB9C] font-semibold"
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
            case 'TaskType':
                const taskTypeSelectValue = filters.taskTypeID !== undefined
                    ? filters.taskTypeID.toString()
                    : ''
                return (
                    <select
                        value={taskTypeSelectValue}
                        onChange={(event) => {
                            const {value} = event.target

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
                        }}
                        className="w-full border rounded-sm px-2 py-0 text-[11px] bg-[#F1EB9C] font-semibold"
                    >
                        <option value="">All</option>
                        {taskTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                )
            case 'AssignedToName':
                const assignedToSelectValue = filters.assignedToID !== undefined
                    ? filters.assignedToID.toString()
                    : (filters.unassignedPreset ?? '')

                return (
                    <select
                        value={assignedToSelectValue}
                        onChange={(event) => {
                            const {value} = event.target

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
                        }}
                        className="w-full border rounded-sm px-2 py-0 text-[11px] bg-[#F1EB9C] font-semibold"
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
            default:
                return null
        }
    }, [filters.ticketNumber, filters.taskName, filters.projectName, filters.statusID, filters.statusPreset, filters.taskTypeID, filters.assignedToID, filters.unassignedPreset, handleFilterChange, statusOptions, taskTypeOptions, assignedToOptions])

    return (
        <div className="container mx-auto py-10">
            {/* Data Table */}
            <DataTable
                columns={taskColumns}
                data={initialTasks}
                onSortChange={handleSortChange}
                renderHeaderFilter={renderHeaderFilter}
                getRowClassName={getTaskRowClassName}
            />
        </div>
    )
}
