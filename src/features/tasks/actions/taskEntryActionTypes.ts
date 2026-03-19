export interface CreateTaskNoteState {
  success: boolean
  fieldErrors: {
    taskNote?: string
  }
  formError?: string
}

export const INITIAL_CREATE_TASK_NOTE_STATE: CreateTaskNoteState = {
  success: false,
  fieldErrors: {},
}

export interface CreateTaskTimeEntryState {
  success: boolean
  fieldErrors: {
    entryDate?: string
    hours?: string
  }
  formError?: string
}

export const INITIAL_CREATE_TASK_TIME_ENTRY_STATE: CreateTaskTimeEntryState = {
  success: false,
  fieldErrors: {},
}

