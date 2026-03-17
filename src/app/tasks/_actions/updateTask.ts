'use server'

import { revalidatePath } from 'next/cache'
import { updateTask as updateTaskRecord } from '@/server/data/task'

export async function updateTask(taskId: number, formData: FormData) {
  const statusValue = String(formData.get('statusId') ?? '').trim()
  const dueDateValue = String(formData.get('dueDate') ?? '').trim()
  const scheduledDueDateValue = String(formData.get('scheduledDueDate') ?? '').trim()
  const taskNameValue = String(formData.get('taskName') ?? '').trim()
  const drawingNumberValue = String(formData.get('drawingNumber') ?? '').trim()
  const opNumberValue = String(formData.get('opNumber') ?? '').trim()

  const update: Parameters<typeof updateTaskRecord>[1] = {}

  if (statusValue.length === 0) {
    update.StatusID = null
  } else {
    const parsedStatusId = Number(statusValue)
    if (!Number.isInteger(parsedStatusId)) {
      throw new Error('Invalid status value')
    }
    update.StatusID = parsedStatusId
  }

  update.DueDate = dueDateValue ? new Date(dueDateValue) : null
  update.ScheduledDueDate = scheduledDueDateValue ? new Date(scheduledDueDateValue) : null
  update.TaskName = taskNameValue || null
  update.DrawingNumber = drawingNumberValue || null
  update.Operation = opNumberValue || undefined

  await updateTaskRecord(taskId, update)

  revalidatePath('/tasks')
  revalidatePath(`/tasks/${taskId}`)
}

