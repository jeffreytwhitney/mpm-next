/**
 * Shared state and field-error types for task create/update server actions.
 */
// Field errors for Create Task
export type CreateTaskFieldErrors = Partial<Record<
  | 'taskName'
  | 'projectId'
  | 'opNumber'
  | 'dueDate'
  | 'scheduledDueDate'
  | 'manufacturingRev'
  | 'taskTypeID',
  string
>>

export interface CreateTaskFormValues {
  projectID: string
  taskTypeID: string
  dueDate: string
  scheduledDueDate: string
  taskName: string
  manufacturingRev: string
  drawingNumber: string
  opNumber: string
}

export interface CreateTaskState {
  success: boolean
  fieldErrors: CreateTaskFieldErrors
  formError?: string
  values?: CreateTaskFormValues
}

export const INITIAL_CREATE_TASK_STATE: CreateTaskState = {
  success: false,
  fieldErrors: {},
}

// Field errors for Update Task
export type UpdateTaskFieldErrors = Partial<Record<
  | 'taskName'
  | 'statusId'
  | 'opNumber'
  | 'dueDate'
  | 'scheduledDueDate'
  | 'assigneeID'
  | 'manufacturingRev'
  | 'waitingReason'
  | 'waitingNote'
  | 'canceledNote'
  | 'completedNote'
  | 'entryDate'
  | 'hours',
  string
>>

export interface UpdateTaskState {
  success: boolean
  fieldErrors: UpdateTaskFieldErrors
  formError?: string
}

export const INITIAL_UPDATE_TASK_STATE: UpdateTaskState = {
  success: false,
  fieldErrors: {},
}

