'use server'

import { revalidatePath } from 'next/cache'
import { requireCurrentUser } from '@/lib/auth/currentUser'
import { parseDateValue } from '@/lib/date'
import type { CreateTaskTimeEntryState } from '@/features/tasks/actions/taskEntryActionTypes'
import { addTaskTimeEntry } from '@/features/tasks/mutations/taskTimeMutations'

export async function createTaskTimeEntryAction(
  taskId: number,
  _prevState: CreateTaskTimeEntryState,
  formData: FormData,
): Promise<CreateTaskTimeEntryState> {
  try {
    const currentUser = await requireCurrentUser()
    const entryDateRaw = String(formData.get('entryDate') ?? '').trim()
    const hoursRaw = String(formData.get('hours') ?? '').trim()

    const fieldErrors: CreateTaskTimeEntryState['fieldErrors'] = {}

    const parsedEntryDate = parseDateValue(entryDateRaw)
    if (!parsedEntryDate) {
      fieldErrors.entryDate = 'Entry date is required.'
    }

    const parsedHours = Number(hoursRaw)
    if (!Number.isFinite(parsedHours) || parsedHours <= 0) {
      fieldErrors.hours = 'Hours must be greater than 0.'
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        fieldErrors,
      }
    }

    await addTaskTimeEntry({
      taskId,
      assigneeId: currentUser.userId,
      entryDate: parsedEntryDate as Date,
      hours: parsedHours,
    })

    revalidatePath('/tasks')
    revalidatePath(`/tasks/${taskId}`)

    return {
      success: true,
      fieldErrors: {},
    }
  } catch (error) {
    console.error('Error creating task time entry:', error)
    return {
      success: false,
      fieldErrors: {},
      formError: 'Unable to save time entry right now. Please try again.',
    }
  }
}

