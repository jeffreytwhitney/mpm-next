'use client'

import React, { useState, useCallback } from 'react'
import { DataTable } from '@/components/DataTable'
import { getTaskList, type TaskListItem } from '@/app/actions/taskListActions'
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
}

export function TaskListClient() {
  const [tasks, setTasks] = useState<TaskListItem[]>([])
  const [filters, setFilters] = useState<TaskFilters>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch tasks whenever filters change
  React.useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const result = await getTaskList(filters)
        setTasks(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
        setTasks([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchTasks()
  }, [filters])

  // Handle filter changes - update specific filter keys only
  const handleFilterChange = useCallback((key: keyof TaskFilters, value: string | number | undefined) => {
    setFilters((prevFilters) => {
      // Only update if the value actually changed
      if (prevFilters[key] === value) {
        return prevFilters
      }
      return {
        ...prevFilters,
        [key]: value,
      }
    })
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
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      ) : (
        <DataTable columns={taskColumns} data={tasks} />
      )}
    </div>
  )
}

