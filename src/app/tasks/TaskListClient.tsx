'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/DataTable'
import { type TaskListItem, type TaskStatusOption } from '@/app/actions/taskListActions'
import DebouncedInput from '@/components/DebouncedInput'
import {taskColumns} from "@/components/columnDefs/TaskListColumns"

interface TaskFilters {
  statusID?: number
  statusPreset?: 'activeNotWaiting'
  ticketNumber?: string
  ticketName?: string
  assignedToName?: string
  taskName?: string
  projectName?: string
  departmentName?: string
  submittedByName?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

interface TaskListClientProps {
  initialTasks: TaskListItem[]
  initialFilters: TaskFilters
  initialStatusOptions: TaskStatusOption[]
}

export function TaskListClient({ initialTasks, initialFilters, initialStatusOptions }: TaskListClientProps) {
  const router = useRouter()
  const [filters, setFilters] = useState<TaskFilters>(initialFilters)
  const isInitialMount = React.useRef(true)
  const statusOptions = React.useMemo(() => {
    if (filters.statusID === undefined) {
      return initialStatusOptions
    }

    const hasSelected = initialStatusOptions.some((option) => option.value === filters.statusID)
    if (hasSelected) {
      return initialStatusOptions
    }

    return [...initialStatusOptions, { value: filters.statusID, label: `Status ${filters.statusID}` }]
  }, [initialStatusOptions, filters.statusID])

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
    router.push(`/tasks?${params.toString()}`, { scroll: false })
  }, [filters, router])

  // Handle filter changes - update specific filter keys only
  const handleFilterChange = useCallback((key: keyof TaskFilters, value: string | number | undefined) => {
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
            className="w-full border rounded-md px-2 py-1 text-xs"
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
            className="w-full border rounded-md px-2 py-1 text-xs"
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
            className="w-full border rounded-md px-2 py-1 text-xs"
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
              const { value } = event.target

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
            className="w-full border rounded-md px-2 py-1 text-xs bg-white"
          >
            <option value="">Active</option>
            <option value="activeNotWaiting">Active Not Waiting</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      default:
        return null
    }
  }, [filters.ticketNumber, filters.taskName, filters.projectName, filters.statusID, filters.statusPreset, handleFilterChange, statusOptions])

  return (
    <div className="container mx-auto py-10">
      {/* Data Table */}
      <DataTable
        columns={taskColumns}
        data={initialTasks}
        onSortChange={handleSortChange}
        renderHeaderFilter={renderHeaderFilter}
      />
    </div>
  )
}
