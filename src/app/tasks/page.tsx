import { TaskListClient } from './TaskListClient'
import { getTaskList } from '@/app/actions/taskListActions'
import type { TaskStatusPreset } from '@/app/actions/taskListActions'
import {getTaskStatusOptions} from "@/app/actions/statusActions";

interface SearchParams {
  statusID?: string
  statusPreset?: string
  ticketNumber?: string
  ticketName?: string
  assignedToName?: string
  taskName?: string
  projectName?: string
  departmentName?: string
  submittedByName?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: string
  pageSize?: string
}

interface TaskListPageProps {
  searchParams: SearchParams
}

export default async function TaskListPage({ searchParams }: TaskListPageProps) {
  // Await searchParams Promise
  const params = await searchParams
  const parsedStatusID = params.statusID ? parseInt(params.statusID, 10) : undefined
  const statusPreset: TaskStatusPreset | undefined =
    params.statusPreset === 'activeNotWaiting' ? 'activeNotWaiting' : undefined

  // Convert URL search params to filter object
  const filters = {
    statusID: parsedStatusID !== undefined && !Number.isNaN(parsedStatusID) ? parsedStatusID : undefined,
    statusPreset,
    ticketNumber: params.ticketNumber,
    ticketName: params.ticketName,
    assignedToName: params.assignedToName,
    taskName: params.taskName,
    projectName: params.projectName,
    departmentName: params.departmentName,
    submittedByName: params.submittedByName,
    sortBy: params.sortBy,
    sortOrder: (params.sortOrder as 'asc' | 'desc') || 'asc',
    page: params.page ? parseInt(params.page) : 1,
    pageSize: params.pageSize ? parseInt(params.pageSize) : 25,
  }

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
