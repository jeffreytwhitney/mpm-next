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
  | 'cancelledNote'
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


