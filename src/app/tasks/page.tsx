import React from 'react'
import { getTaskList } from '@/app/actions/taskListActions'
import { DataTable, taskColumns } from '@/components/TaskListTable'

export default async function TasksPage() {
  const tasks = await getTaskList()

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-gray-600 mt-2">View and manage all tasks from the system</p>
      </div>

      <DataTable columns={taskColumns} data={tasks} />
    </div>
  )
}

