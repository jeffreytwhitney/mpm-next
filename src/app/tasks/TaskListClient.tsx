'use client'

/**
 * AUTO-GENERATED MODULE DOC
 * App Router module for route composition and rendering.
 */
import React, {useCallback} from 'react'
import {usePathname, useRouter} from 'next/navigation'
import {DataTable} from '@/components/DataTable'
import {type TaskListFilters, type TaskListItem} from '@/server/data/taskList'
import DebouncedInput from '@/components/DebouncedInput'
import {taskColumns} from '@/components/columnDefs/TaskListColumns'
import {type TaskStatusDropdownOption} from '@/server/data/taskStatus'
import {type TaskTypeDropdownOption} from '@/server/data/taskType'
import {type UserDropDownOption} from '@/server/data/user'
import {type DepartmentDropdownOption} from '@/server/data/department'
import {PAGE_SIZE, TEXT_FILTER_CLASS, FILTER_RESET_TITLE} from '@/lib/filterConstants'
import {Pagination} from '@/components/Pagination'
import {useTaskFilters} from '@/features/tasks/hooks/useTaskFilters'
import {StatusFilter, TaskTypeFilter, AssignedToFilter, DepartmentFilter} from '@/features/tasks/components/TaskListFilterControls'
import {getTaskRowStyle} from './_utils/taskRowStyle'

type TextFilterKey = 'ticketNumber' | 'taskName' | 'projectName'

interface TaskListClientProps {
    initialTasks: TaskListItem[]
    initialFilters: TaskListFilters
    initialStatusOptions: TaskStatusDropdownOption[]
    initialTaskTypeOptions: TaskTypeDropdownOption[]
    initialAssigneeOptions: UserDropDownOption[]
    initialDepartmentOptions: DepartmentDropdownOption[]
    totalCount: number
}

export function TaskListClient({initialTasks, initialFilters, initialStatusOptions, initialTaskTypeOptions, initialAssigneeOptions, initialDepartmentOptions, totalCount}: TaskListClientProps) {
    const router = useRouter()
    const pathname = usePathname()
    const lastNavigatedHrefRef = React.useRef<string | null>(null)

    const handleFiltersChanged = useCallback((nextFilters: TaskListFilters) => {
        if (pathname !== '/tasks') {
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
        const href = queryString ? `/tasks?${queryString}` : '/tasks'
        if (lastNavigatedHrefRef.current === href) {
            return
        }

        lastNavigatedHrefRef.current = href
        router.replace(href, {scroll: false})
    }, [pathname, router])

    const {
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
    } = useTaskFilters({
        initialFilters,
        initialStatusOptions,
        initialTaskTypeOptions,
        initialAssigneeOptions,
        initialDepartmentOptions,
        onFiltersChanged: handleFiltersChanged,
    })

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
            case 'Status':
                return <StatusFilter statusID={filters.statusID} statusPreset={filters.statusPreset} options={statusOptions} onChange={handleStatusSelectChange} onReset={resetStatusFilter} />
            case 'TaskType':
                return <TaskTypeFilter taskTypeID={filters.taskTypeID} options={taskTypeOptions} onChange={handleTaskTypeSelectChange} onReset={resetTaskTypeFilter} />
            case 'AssignedToName':
                return <AssignedToFilter assignedToID={filters.assignedToID} unassignedPreset={filters.unassignedPreset} options={assignedToOptions} onChange={handleAssignedToSelectChange} onReset={resetAssignedToFilter} />
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
                columns={taskColumns}
                data={initialTasks}
                onSortChange={handleSortChange}
                sortColumn={filters.sortBy ?? 'DueDate'}
                sortDirection={filters.sortOrder ?? 'asc'}
                renderHeaderFilter={renderHeaderFilter}
                getRowStyle={getTaskRowStyle}
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
