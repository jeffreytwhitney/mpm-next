'use server'

import { prisma } from '@/lib/prisma'

export async function getTaskList(filters?: {
  projectID?: number
  statusID?: number
  assignedToID?: number
}) {
  try {
    const tasks = await prisma.qryTaskList.findMany({
      where: {
        StatusID: filters?.statusID ?? { lt: 4 },
        ...(filters?.projectID && { ProjectID: filters.projectID }),
        ...(filters?.assignedToID && { AssignedToID: filters.assignedToID }),
      },
      orderBy: {
        ID: 'asc',
      },
    })
    return tasks
  } catch (error) {
    console.error('Error fetching tasks:', error)
    throw new Error('Failed to fetch tasks')
  }
}

export async function getTaskById(id: number) {
  try {
    const task = await prisma.tblTask.findFirst({
      where: { ID: id },
    })
    return task
  } catch (error) {
    console.error('Error fetching task:', error)
    throw new Error('Failed to fetch task')
  }
}

