/**
 * Task Time Entry Mutations Module
 *
 * Provides high-level mutations for task time entry operations.
 * Wraps low-level data access with business logic including:
 * - Hours validation (must be positive and finite)
 * - Date normalization to start-of-day for consistency
 * - Assignment of entry to current user
 * - Integration with task and ticket relationships
 */
import { createTaskTimeEntry } from '@/server/data/taskTime'
import { startOfDay } from '@/lib/date'

interface AddTaskTimeEntryInput {
  taskId: number
  assigneeId: number
  entryDate: Date
  hours: number
}

export async function addTaskTimeEntry(input: AddTaskTimeEntryInput) {
  if (!Number.isFinite(input.hours) || input.hours <= 0) {
    throw new Error('Hours must be greater than 0.')
  }

  return createTaskTimeEntry({
    TaskID: input.taskId,
    AssignedToID: input.assigneeId,
    EntryDate: startOfDay(input.entryDate),
    Hours: input.hours,
  })
}

