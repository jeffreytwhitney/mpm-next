'use server'

/**
 * Creates a note entry on a task from task detail form submissions.
 *
 * Responsibilities in this module:
 * - Parse and validate submitted note text.
 * - Resolve the current authenticated user.
 * - Persist the task note with update-user attribution.
 * - Revalidate task list/detail routes after a successful write.
 */
import { revalidatePath } from 'next/cache'
import { requireCurrentUser } from '@/lib/auth/currentUser'
import type { CreateTaskNoteState } from '@/features/tasks/actions/taskEntryActionTypes'
import { addTaskNote } from '@/features/tasks/mutations/taskNoteMutations'

function validateAndParseTaskNote(formData: FormData):
  | { parsed: { taskNote: string } }
  | { errorState: CreateTaskNoteState } {
  const taskNote = String(formData.get('taskNote') ?? '').trim()

  if (!taskNote) {
    return {
      errorState: {
        success: false,
        fieldErrors: {
          taskNote: 'Note is required.',
        },
      },
    }
  }

  return {
    parsed: {
      taskNote,
    },
  }
}

export async function createTaskNoteAction(
  taskId: number,
  _prevState: CreateTaskNoteState,
  formData: FormData,
): Promise<CreateTaskNoteState> {
  const validationResult = validateAndParseTaskNote(formData)
  if ('errorState' in validationResult) {
    return validationResult.errorState
  }

  const { taskNote } = validationResult.parsed

  try {
    const currentUser = await requireCurrentUser()

    await addTaskNote({
      taskId,
      note: taskNote,
      updateUserId: currentUser.userId,
    })

    revalidatePath('/tasks')
    revalidatePath(`/tasks/${taskId}`)

    return {
      success: true,
      fieldErrors: {},
    }
  } catch (error) {
    console.error('Error creating task note:', error)
    return {
      success: false,
      fieldErrors: {},
      formError: 'Unable to save note right now. Please try again.',
    }
  }
}

