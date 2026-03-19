'use server'

import { revalidatePath } from 'next/cache'
import { requireCurrentUser } from '@/lib/auth/currentUser'
import type { CreateTaskNoteState } from '@/features/tasks/actions/taskEntryActionTypes'
import { addTaskNote } from '@/features/tasks/server/taskNoteMutations'

export async function createTaskNoteAction(
  taskId: number,
  _prevState: CreateTaskNoteState,
  formData: FormData,
): Promise<CreateTaskNoteState> {
  try {
    const currentUser = await requireCurrentUser()
    const taskNote = String(formData.get('taskNote') ?? '').trim()

    if (!taskNote) {
      return {
        success: false,
        fieldErrors: {
          taskNote: 'Note is required.',
        },
      }
    }

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

