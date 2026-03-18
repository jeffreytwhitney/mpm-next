'use server'

import { revalidatePath } from 'next/cache'
import {
  isRevertingToNotStarted,
  shouldSetDateStartedForTransition,
  TASK_STATUS_NOT_STARTED_ID,
} from '@/lib/taskStatusTransition'
import { getTaskById, updateTask as updateTaskRecord } from '@/server/data/task'
import type { UpdateTaskFieldErrors, UpdateTaskState } from '@/app/tasks/_actions/updateTaskTypes'
import { parseDateValue } from '@/lib/date'

interface ParsedUpdateTaskForm {
  statusId: number
  assigneeId: number | null
  dueDate: Date
  scheduledDueDate: Date
  taskName: string
  manufacturingRev: string
  drawingNumber: string
  operation: string
  manualDueDate: 0 | 1
}

function validateAndParseUpdateTaskForm(formData: FormData):
  | { parsed: ParsedUpdateTaskForm }
  | { errorState: UpdateTaskState } {
  const statusValue = String(formData.get('statusId') ?? '').trim()
  const assigneeValue = String(formData.get('assigneeID') ?? '').trim()
  const dueDateValue = String(formData.get('dueDate') ?? '').trim()
  const scheduledDueDateValue = String(formData.get('scheduledDueDate') ?? '').trim()
  const taskNameValue = String(formData.get('taskName') ?? '').trim()
  const manufacturingRevValue = String(formData.get('manufacturingRev') ?? '').trim()
  const drawingNumberValue = String(formData.get('drawingNumber') ?? '').trim()
  const opNumberValue = String(formData.get('opNumber') ?? '').trim()
  const manualDueDateValue: 0 | 1 = formData.get('manualDueDate') === 'on' ? 1 : 0

  const fieldErrors: UpdateTaskFieldErrors = {}

  if (!taskNameValue) {
    fieldErrors.taskName = 'Task name is required.'
  }
  if (!manufacturingRevValue) {
    fieldErrors.manufacturingRev = 'Rev is required.'
  }
  if (!statusValue) {
    fieldErrors.statusId = 'Status is required.'
  }
  if (!opNumberValue) {
    fieldErrors.opNumber = 'Op number is required.'
  }
  if (!dueDateValue) {
    fieldErrors.dueDate = 'Due date is required.'
  }
  if (!scheduledDueDateValue) {
    fieldErrors.scheduledDueDate = 'Scheduled due date is required.'
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      errorState: {
        success: false,
        fieldErrors,
      },
    }
  }

  const parsedStatusId = Number(statusValue)
  if (!Number.isInteger(parsedStatusId)) {
    return {
      errorState: {
        success: false,
        fieldErrors: {
          statusId: 'Status is invalid.',
        },
      },
    }
  }

  const parsedAssigneeId = assigneeValue.length > 0 ? Number(assigneeValue) : null
  if (assigneeValue.length > 0 && (!Number.isInteger(parsedAssigneeId) || (parsedAssigneeId ?? 0) <= 0)) {
    return {
      errorState: {
        success: false,
        fieldErrors: {
          assigneeID: 'Assignee is invalid.',
        },
      },
    }
  }

  if (parsedStatusId !== TASK_STATUS_NOT_STARTED_ID && parsedAssigneeId == null) {
    return {
      errorState: {
        success: false,
        fieldErrors: {
          assigneeID: 'Cannot have a status other than Not Started without an assignee.',
        },
      },
    }
  }

  const parsedDueDate = parseDateValue(dueDateValue)
  const parsedScheduledDueDate = parseDateValue(scheduledDueDateValue)

  if (!parsedDueDate || !parsedScheduledDueDate) {
    return {
      errorState: {
        success: false,
        fieldErrors: {
          ...(parsedDueDate ? {} : { dueDate: 'Due date is invalid.' }),
          ...(parsedScheduledDueDate ? {} : { scheduledDueDate: 'Scheduled due date is invalid.' }),
        },
      },
    }
  }

  return {
    parsed: {
      statusId: parsedStatusId,
      assigneeId: parsedAssigneeId,
      dueDate: parsedDueDate,
      scheduledDueDate: parsedScheduledDueDate,
      taskName: taskNameValue,
      manufacturingRev: manufacturingRevValue,
      drawingNumber: drawingNumberValue,
      operation: opNumberValue,
      manualDueDate: manualDueDateValue,
    },
  }
}

export async function updateTask(
  taskId: number,
  _prevState: UpdateTaskState,
  formData: FormData,
): Promise<UpdateTaskState> {
  const validationResult = validateAndParseUpdateTaskForm(formData)
  if ('errorState' in validationResult) {
    return validationResult.errorState
  }

  const {
    statusId,
    assigneeId,
    dueDate,
    scheduledDueDate,
    taskName,
    manufacturingRev,
    drawingNumber,
    operation,
    manualDueDate,
  } = validationResult.parsed

  try {
    const currentTask = await getTaskById(taskId)
    if (!currentTask) {
      return {
        success: false,
        fieldErrors: {},
        formError: 'Task was not found.',
      }
    }

    if (isRevertingToNotStarted(currentTask.StatusID, statusId)) {
      return {
        success: false,
        fieldErrors: {
          statusId: 'Cannot move a Started or Waiting task back to Not Started.',
        },
      }
    }

    if (currentTask.AssignedToID && assigneeId == null) {
      return {
        success: false,
        fieldErrors: {
          assigneeID: 'Cannot remove assignee once assigned.',
        },
      }
    }

    const shouldSetDateStarted =
      currentTask.DateStarted == null && shouldSetDateStartedForTransition(currentTask.StatusID, statusId)

    const update: Parameters<typeof updateTaskRecord>[1] = {
      StatusID: statusId,
      AssignedToID: assigneeId,
      DueDate: dueDate,
      ScheduledDueDate: scheduledDueDate,
      TaskName: taskName,
      ManufacturingRev: manufacturingRev || null,
      DrawingNumber: drawingNumber || null,
      Operation: operation,
      ManualDueDate: manualDueDate,
      ...(shouldSetDateStarted ? { DateStarted: new Date() } : {}),
    }

    const updatedTask = await updateTaskRecord(taskId, update)
    if (!updatedTask) {
      return {
        success: false,
        fieldErrors: {},
        formError: 'Task was not found.',
      }
    }

    revalidatePath('/tasks')
    revalidatePath(`/tasks/${taskId}`)

    return {
      success: true,
      fieldErrors: {},
    }
  } catch (error) {
    console.error('Error updating task:', error)
    return {
      success: false,
      fieldErrors: {},
      formError: 'Unable to save task right now. Please try again.',
    }
  }
}
