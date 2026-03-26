'use server'

/**
 * Creates a task time-entry from task detail form submissions.
 *
 * Responsibilities in this module:
 * - Parse and validate entry date/hours from FormData.
 * - Resolve the current authenticated user as assignee.
 * - Persist a time-entry record for the selected task.
 * - Revalidate task list/detail routes after a successful write.
 */
import { revalidatePath } from 'next/cache'
import { requireCurrentUser } from '@/lib/auth/currentUser'
import { parseDateValue } from '@/lib/date'
import type { CreateTaskTimeEntryState } from '@/features/tasks/actions/taskEntryActionTypes'
import { addTaskTimeEntry } from '@/features/tasks/mutations/taskTimeMutations'

function validateAndParseTaskTimeEntry(formData: FormData):
  | { parsed: { entryDate: Date; hours: number } }
  | { errorState: CreateTaskTimeEntryState } {
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

  if (Object.keys(fieldErrors).length > 0 || !parsedEntryDate) {
    return {
      errorState: {
        success: false,
        fieldErrors,
      },
    }
  }

  return {
    parsed: {
      entryDate: parsedEntryDate,
      hours: parsedHours,
    },
  }
}

export async function createTaskTimeEntryAction(
  taskId: number,
  _prevState: CreateTaskTimeEntryState,
  formData: FormData,
): Promise<CreateTaskTimeEntryState> {
  const validationResult = validateAndParseTaskTimeEntry(formData)
  if ('errorState' in validationResult) {
    return validationResult.errorState
  }

  const { entryDate, hours } = validationResult.parsed

  try {
    const currentUser = await requireCurrentUser()

    await addTaskTimeEntry({
      taskId,
      assigneeId: currentUser.userId,
      entryDate,
      hours,
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

