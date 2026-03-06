import { TaskListClient } from './TaskListClient'
import { getTaskList } from '@/app/actions/taskListActions'

interface SearchParams {
  statusID?: string
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

  // Convert URL search params to filter object
  const filters = {
    statusID: params.statusID ? parseInt(params.statusID) : undefined,
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
    pageSize: params.pageSize ? parseInt(params.pageSize) : 50,
  }

  // Fetch data on the server with filters from URL
  const tasks = await getTaskList(filters)

  return <TaskListClient initialTasks={tasks} initialFilters={filters} />
}
