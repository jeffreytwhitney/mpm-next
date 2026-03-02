'use server'

import {prisma} from '@/lib/prisma'

export async function getTaskList(filters?: {
  statusID?: number
  ticketNumber?: string
  ticketName?: string
  assignedToName?: string
  taskName?: string
  projectName?: string
  departmentName?: string
  submittedByName?: string
}) {
  try {
    return await prisma.qryTaskList.findMany({
      where: {
        StatusID: filters?.statusID !== undefined ? filters.statusID : {lt: 4},
        ...(filters?.ticketNumber && {TicketNumber: {contains: filters.ticketNumber}}),
        ...(filters?.assignedToName && {AssignedToName: filters.assignedToName}),
        ...(filters?.taskName && {TaskName: {contains: filters.taskName}}),
        ...(filters?.projectName && {ProjectName: {contains: filters.projectName}}),
        ...(filters?.departmentName && {DepartmentName: filters.departmentName}),
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

