'use server'

import {prisma} from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'

// Define the select object to be reused
const taskListSelect = {
  ID: true,
  TicketNumber: true,
  TaskName: true,
  ProjectName: true,
  CurrentlyRunning: true,
  ManufacturingRev: true,
  Status: true,
  StatusID: true,
  DepartmentName: true,
  DepartmentID: true,
  DrawingNumber: true,
  Operation: true,
  DueDate: true,
} satisfies Prisma.qryTaskListSelect

// Export the return type for use in components
export type TaskListItem = Prisma.qryTaskListGetPayload<{
  select: typeof taskListSelect
}>

export async function getTaskList(filters?: {
  statusID?: number
  ticketNumber?: string
  ticketName?: string
  assignedToID?: number
  taskName?: string
  projectName?: string
  departmentID?: number
  submittedByName?: string
}): Promise<TaskListItem[]> {
  try {
    return await prisma.qryTaskList.findMany({
      select: taskListSelect,
      where: {
        StatusID: filters?.statusID !== undefined ? filters.statusID : {lt: 4},
        ...(filters?.ticketNumber && {TicketNumber: {contains: filters.ticketNumber}}),
        ...(filters?.assignedToID && {AssignedToID: filters.assignedToID}),
        ...(filters?.taskName && {TaskName: {contains: filters.taskName}}),
        ...(filters?.projectName && {ProjectName: {contains: filters.projectName}}),
        ...(filters?.departmentID && {DepartmentID: filters.departmentID}),
        ...(filters?.submittedByName && {SubmittedByName: filters.submittedByName}),
      },
      orderBy: {
        ID: 'asc',
      },
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    throw new Error('Failed to fetch tasks')
  }
}

export async function getTaskById(id: number) {
  try {
    return await prisma.tblTask.findFirst({
      where: {ID: id},
    })
  } catch (error) {
    console.error('Error fetching task:', error)
    throw new Error('Failed to fetch task')
  }
}

