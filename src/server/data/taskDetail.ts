import { prisma } from '@/lib/prisma'
import { getTaskById, type TaskItem } from '@/server/data/task'
import { getTicketById, getQualityEngineerByTicketID, getManufacturingEngineerByTicketID, type TicketItem } from '@/server/data/ticket'
import { getDepartmentById } from '@/server/data/department'

const taskDetailViewSelect = {
  JobNumber: true,
  SumOfHours: true,
}

interface TaskDetailViewRow {
  JobNumber: string | null
  SumOfHours: number | null
}

export interface TaskDetailModel {
  task: TaskItem
  ticket: TicketItem
  departmentName: string | null
  qualityEngineerName: string | null
  manufacturingEngineerName: string | null
  jobNumber: string | null
  totalTrackedHours: number | null
}

async function getTaskDetailViewRow(taskId: number): Promise<TaskDetailViewRow | null> {
  return prisma.qryTaskListRaw.findFirst({
    select: taskDetailViewSelect,
    where: { ID: taskId },
  })
}

export async function getTaskDetailById(taskId: number): Promise<TaskDetailModel | null> {
  try {
    const task = await getTaskById(taskId)

    if (!task || task.ProjectID == null) {
      return null
    }

    const { ticket } = await getTicketById(task.ProjectID)

    const [department, qualityEngineer, manufacturingEngineer, detailViewRow] = await Promise.all([
      getDepartmentById(ticket.DepartmentID),
      getQualityEngineerByTicketID(ticket.ID),
      getManufacturingEngineerByTicketID(ticket.ID),
      getTaskDetailViewRow(taskId),
    ])

    return {
      task,
      ticket,
      departmentName: department?.DepartmentName ?? null,
      qualityEngineerName: qualityEngineer?.FullName ?? null,
      manufacturingEngineerName: manufacturingEngineer?.FullName ?? null,
      jobNumber: detailViewRow?.JobNumber ?? null,
      totalTrackedHours: detailViewRow?.SumOfHours ?? null,
    }
  } catch (error) {
    console.error('Error fetching task detail:', error)
    throw new Error('Failed to fetch task detail')
  }
}
