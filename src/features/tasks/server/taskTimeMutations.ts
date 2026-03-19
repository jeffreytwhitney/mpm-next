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

