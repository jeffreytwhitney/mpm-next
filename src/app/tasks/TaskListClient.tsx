'use client'

import React, {useCallback} from 'react'
import {DataTable} from '@/components/DataTable'
import {type TaskListFilters, type TaskListItem} from '@/server/data/taskList'
import DebouncedInput from '@/components/DebouncedInput'
import {taskColumns} from '@/components/columnDefs/TaskListColumns'
import {type TaskStatusDropdownOption} from '@/server/data/taskStatus'
import {type TaskTypeDropdownOption} from '@/server/data/taskType'
import {type UserDropDownOption} from '@/server/data/user'
import {type DepartmentDropdownOption} from '@/server/data/department'
import {ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon} from '@heroicons/react/24/solid'
import {PAGE_SIZE, TEXT_FILTER_CLASS, FILTER_RESET_TITLE} from './_constants'
import {getTaskRowStyle} from './_utils/taskRowStyle'
import {useTaskListFilters} from './_hooks/useTaskListFilters'
import {StatusFilter, TaskTypeFilter, AssignedToFilter, DepartmentFilter} from './_components/TaskListFilterControls'

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
    } = useTaskListFilters({initialFilters, initialStatusOptions, initialTaskTypeOptions, initialAssigneeOptions, initialDepartmentOptions})

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
                renderHeaderFilter={renderHeaderFilter}
                getRowStyle={getTaskRowStyle}
            />
            <div className="flex items-center justify-between mt-2 px-1 text-xs text-slate-600">
                <span>{totalCount.toLocaleString()} results</span>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleFilterChange('page', 1)}
                        disabled={currentPage <= 1}
                        className="px-2 py-1 border rounded text-xs disabled:opacity-40 hover:bg-slate-100 disabled:cursor-not-allowed"
                        title="First page"
                    >
                        <ChevronDoubleLeftIcon className="w-3 h-3" />
                    </button>
                    <button
                        onClick={() => handleFilterChange('page', currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="px-2 py-1 border rounded text-xs disabled:opacity-40 hover:bg-slate-100 disabled:cursor-not-allowed"
                        title="Previous page"
                    >
                        <ChevronLeftIcon className="w-3 h-3" />
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                        onClick={() => handleFilterChange('page', currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-2 py-1 border rounded text-xs disabled:opacity-40 hover:bg-slate-100 disabled:cursor-not-allowed"
                        title="Next page"
                    >
                        <ChevronRightIcon className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    )
}
