'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/DataTable'
import { type TaskListItem } from '@/app/actions/taskListActions'
import DebouncedInput from '@/components/DebouncedInput'
import {taskColumns} from "@/components/columnDefs/TaskListColumns"

interface TaskFilters {
  statusID?: number
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
}

export function TaskListClient({ initialTasks, initialFilters }: TaskListClientProps) {
  const router = useRouter()
  const [filters, setFilters] = useState<TaskFilters>(initialFilters)
  const isInitialMount = React.useRef(true)

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

  return (
    <div className="container mx-auto py-10">
      {/* Filter Section */}
      <div className="mb-1 p-4 bg-slate-50 dark:bg-slate-900 rounded-md border">
        <h2 className="text-lg font-semibold mb-1">Filters</h2>
        <div className="grid grid-cols-3 gap-1">
          <div>
            <label className="block text-sm font-medium mb-1">Status ID</label>
            <DebouncedInput
                type="number"
                placeholder="Leave empty for active (< 4)"
                value={filters.statusID?.toString() ?? ''}
                onChange={(value) =>
                    handleFilterChange('statusID', value ? parseInt(value.toString()) : undefined)
                }
                className="w-full px-3 py-.5 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Task Name</label>
            <DebouncedInput
              type="text"
              placeholder="Filter by task name"
              value={filters.taskName?.toString() ?? ''}
              onChange={(value) =>
                handleFilterChange('taskName', value ? value.toString() : undefined)
              }
              className="w-full px-3 py-.5 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Project Name</label>
            <DebouncedInput
                type="text"
                placeholder="Filter by Ticket Name"
                value={filters.projectName?.toString() ?? ''}
                onChange={(value) =>
                    handleFilterChange('projectName', value ? value.toString() : undefined)
                }
                className="w-full px-3 py-.5 border rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable columns={taskColumns} data={initialTasks} onSortChange={handleSortChange} />
    </div>
  )
}
