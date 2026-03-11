import { TaskListClient } from './TaskListClient'
import { getTaskList, parseTaskListFilters } from '@/app/actions/taskListActions'
import type { TaskListSearchParams } from '@/app/actions/taskListActions'
import {getTaskStatusOptions} from "@/app/actions/statusActions";

interface TaskListPageProps {
  searchParams: TaskListSearchParams
}

export default async function TaskListPage({ searchParams }: TaskListPageProps) {
  // Await searchParams Promise
  const params = await searchParams
  const filters = parseTaskListFilters(params)

  // Fetch data on the server with filters from URL
  const [tasks, statusOptions] = await Promise.all([
    getTaskList(filters),
    getTaskStatusOptions(),
  ])

  return (
    <TaskListClient
      initialTasks={tasks}
      initialFilters={filters}
      initialStatusOptions={statusOptions}
    />
  )
}
