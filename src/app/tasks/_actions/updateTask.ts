'use server'

import { revalidatePath } from 'next/cache'
import { isRevertingToNotStarted, TASK_STATUS_NOT_STARTED_ID } from '@/lib/taskStatusTransition'
import { getTaskById, updateTask as updateTaskRecord } from '@/server/data/task'
import type { UpdateTaskFieldErrors, UpdateTaskState } from '@/app/tasks/_actions/updateTaskTypes'
import { parseDateValue } from '@/lib/date'

export async function updateTask(
  taskId: number,
  _prevState: UpdateTaskState,
  formData: FormData,
): Promise<UpdateTaskState> {
  const statusValue = String(formData.get('statusId') ?? '').trim()
  const assigneeValue = String(formData.get('assigneeID') ?? '').trim()
  const dueDateValue = String(formData.get('dueDate') ?? '').trim()
  const scheduledDueDateValue = String(formData.get('scheduledDueDate') ?? '').trim()
  const taskNameValue = String(formData.get('taskName') ?? '').trim()
  const manufacturingRevValue = String(formData.get('manufacturingRev') ?? '').trim()
  const drawingNumberValue = String(formData.get('drawingNumber') ?? '').trim()
  const opNumberValue = String(formData.get('opNumber') ?? '').trim()


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
      success: false,
      fieldErrors,
    }
  }

  const parsedStatusId = Number(statusValue)
  if (!Number.isInteger(parsedStatusId)) {
    return {
      success: false,
      fieldErrors: {
        statusId: 'Status is invalid.',
      },
    }
  }

  const parsedAssigneeId = assigneeValue.length > 0 ? Number(assigneeValue) : null
  if (assigneeValue.length > 0 && (!Number.isInteger(parsedAssigneeId) || (parsedAssigneeId ?? 0) <= 0)) {
    return {
      success: false,
      fieldErrors: {
        assigneeID: 'Assignee is invalid.',
      },
    }
  }

  if (parsedStatusId !== TASK_STATUS_NOT_STARTED_ID && parsedAssigneeId == null) {
    return {
      success: false,
      fieldErrors: {
        assigneeID: 'Cannot have a status other than Not Started without an assignee.',
      },
    }
  }

  const parsedDueDate = parseDateValue(dueDateValue)
  const parsedScheduledDueDate = parseDateValue(scheduledDueDateValue)

  if (!parsedDueDate || !parsedScheduledDueDate) {
    return {
      success: false,
      fieldErrors: {
        ...(parsedDueDate ? {} : { dueDate: 'Due date is invalid.' }),
        ...(parsedScheduledDueDate ? {} : { scheduledDueDate: 'Scheduled due date is invalid.' }),
      },
    }
  }

  try {
    const currentTask = await getTaskById(taskId)
    if (!currentTask) {
      return {
        success: false,
        fieldErrors: {},
        formError: 'Task was not found.',
      }
    }

    if (isRevertingToNotStarted(currentTask.StatusID, parsedStatusId)) {
      return {
        success: false,
        fieldErrors: {
          statusId: 'Cannot move a Started or Waiting task back to Not Started.',
        },
      }
    }

    if (currentTask.AssignedToID && parsedAssigneeId == null) {
      return {
        success: false,
        fieldErrors: {
          assigneeID: 'Cannot remove assignee once assigned.',
        },
      }
    }

    const update: Parameters<typeof updateTaskRecord>[1] = {
      StatusID: parsedStatusId,
      AssignedToID: parsedAssigneeId,
      DueDate: parsedDueDate,
      ScheduledDueDate: parsedScheduledDueDate,
      TaskName: taskNameValue,
      ManufacturingRev: manufacturingRevValue || null,
      DrawingNumber: drawingNumberValue || null,
      Operation: opNumberValue,
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
