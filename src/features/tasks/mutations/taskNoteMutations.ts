/**
 * Task Note Mutations Module
 *
 * Provides high-level mutations for task note operations.
 * Wraps low-level data access with business logic including:
 * - Note text validation and trimming
 * - User attribution and automation flags
 * - Input normalization before persistence
 */
import { createTaskNote } from '@/server/data/taskNote'

interface AddTaskNoteInput {
  taskId: number
  note: string
  updateUserId?: string | number | null
  isAutomated?: number
}

export async function addTaskNote(input: AddTaskNoteInput) {
  const trimmedNote = input.note.trim()

  if (!trimmedNote) {
    throw new Error('Task note is required.')
  }

  const payload: Parameters<typeof createTaskNote>[0] = {
    TaskID: input.taskId,
    TaskNote: trimmedNote,
  }

  if (input.updateUserId !== undefined) {
    payload.UpdateUserID = input.updateUserId == null ? null : String(input.updateUserId)
  }

  if (input.isAutomated !== undefined) {
    payload.IsNoteAutomated = input.isAutomated
  }

  return createTaskNote(payload)
}

