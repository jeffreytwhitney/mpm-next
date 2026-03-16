'use server'

import { revalidatePath } from 'next/cache'
import { updateTask as updateTaskRecord } from '@/server/data/task'

export async function updateTask(taskId: number, formData: FormData) {
  const statusValue = String(formData.get('statusId') ?? '').trim()

  if (statusValue.length === 0) {
    await updateTaskRecord(taskId, { StatusID: null })
  } else {
    const parsedStatusId = Number(statusValue)
    if (!Number.isInteger(parsedStatusId)) {
      throw new Error('Invalid status value')
    }

    await updateTaskRecord(taskId, { StatusID: parsedStatusId })
  }

  revalidatePath('/tasks')
  revalidatePath(`/tasks/${taskId}`)
}

