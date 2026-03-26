import { isActiveTaskStatus } from '@/features/tasks/taskStatusTransition'

export interface TicketTaskStatusLike {
  StatusID: number | null | undefined
}

export interface TicketTaskFilterable extends TicketTaskStatusLike {
  TaskName?: string | null | undefined
  TaskTypeID?: number | null | undefined
  AssignedToID?: number | null | undefined
}

export interface TicketTaskFilters {
  partName: string
  taskTypeID?: number
  assignedToID?: number
  statusID?: number
}

export function isCompletedOrCanceledTask(statusId: number | null | undefined): boolean {
  return !isActiveTaskStatus(statusId)
}

export function filterTicketTasksByCompletionView<T extends TicketTaskStatusLike>(
  tasks: T[],
  showCompletedTasksOnly: boolean,
): T[] {
  return tasks.filter((task) => {
    const isCompletedOrCanceled = isCompletedOrCanceledTask(task.StatusID)
    return showCompletedTasksOnly ? isCompletedOrCanceled : !isCompletedOrCanceled
  })
}

export function filterTicketTasks<T extends TicketTaskFilterable>(
  tasks: T[],
  filters: TicketTaskFilters,
): T[] {
  const normalizedPartName = filters.partName.trim().toLowerCase()

  return tasks.filter((task) => {
    if (normalizedPartName && !(task.TaskName ?? '').toLowerCase().includes(normalizedPartName)) {
      return false
    }

    if (filters.taskTypeID !== undefined && task.TaskTypeID !== filters.taskTypeID) {
      return false
    }

    if (filters.assignedToID !== undefined && task.AssignedToID !== filters.assignedToID) {
      return false
    }

    return !(filters.statusID !== undefined && task.StatusID !== filters.statusID);


  })
}

