/**
 * Task Note Data Access Module
 *
 * Handles database operations for task notes including:
 * - Retrieving notes associated with a specific task
 * - Creating new task notes with update-user attribution
 * - Tracking automated vs. manual notes
 *
 * Task notes provide audit trail and communication for task progress.
 * Automated notes are system-generated (status transitions, time entries),
 * while manual notes are user-created documentation.
 */
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'

const taskNoteSelect = {
  ID: true,
  TaskID: true,
  TaskNote: true,
  IsNoteAutomated: true,
  CreatedTimestamp: true,
  UpdatedTimestamp: true,
  UpdateUserID: true,
} satisfies Prisma.tblTaskNotesSelect

export type TaskNoteItem = Prisma.tblTaskNotesGetPayload<{ select: typeof taskNoteSelect }>

export interface CreateTaskNoteInput {
  TaskID: number
  TaskNote: string
  UpdateUserID?: string | null
  IsNoteAutomated?: number
}

export async function getTaskNotesByTaskID(taskID: number): Promise<TaskNoteItem[]> {
  try {
    return await prisma.tblTaskNotes.findMany({
      select: taskNoteSelect,
      where: { TaskID: taskID },
      orderBy: {
        CreatedTimestamp: 'desc',
      },
    })
  } catch (error) {
    console.error('Error fetching task notes:', error)
    throw new Error('Failed to fetch task notes')
  }
}

export async function createTaskNote(input: CreateTaskNoteInput): Promise<TaskNoteItem> {
  try {
    const now = new Date()

    return await prisma.tblTaskNotes.create({
      select: taskNoteSelect,
      data: {
        TaskID: input.TaskID,
        TaskNote: input.TaskNote,
        IsNoteAutomated: input.IsNoteAutomated ?? 0,
        CreatedTimestamp: now,
        UpdatedTimestamp: now,
        UpdateUserID: input.UpdateUserID ?? null,
      },
    })
  } catch (error) {
    console.error('Error creating task note:', error)
    throw new Error('Failed to create task note')
  }
}

