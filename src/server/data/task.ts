import {prisma} from "@/lib/prisma";
import type {Prisma} from "@/generated/prisma/client";
import {Prisma as PrismaNamespace} from "@/generated/prisma/client";

const taskSelect = {
    ID: true,
    StatusID: true,
    TaskName: true,
    TaskTypeID: true,
    AssignedToID: true,
    DateStarted: true,
    DrawingNumber: true,    
    DueDate: true,
    ScheduledDueDate: true,
    CreatedTimestamp: true,
    DateCompleted: true,
    ManualDueDate: true,
    CurrentlyRunning: true,
    ProjectID: true,
    Operation : true,
    UpdatedTimestamp: true,
    ManufacturingRev: true,


} satisfies Prisma.tblTaskSelect
export type TaskItem = Prisma.tblTaskGetPayload<{select: typeof taskSelect}>

export async function getTaskById(id: number): Promise<TaskItem | null> {
    try {
        return await prisma.tblTask.findFirst({
            select: taskSelect,
            where: {ID: id},
        })
    } catch (error) {
        console.error('Error fetching task:', error)
        throw new Error('Failed to fetch task')
    }
}

export async function getTasksByProjectId(projectId: number): Promise<TaskItem[]> {
    try {
        return await prisma.tblTask.findMany({
            select: taskSelect,
            where: {ProjectID: projectId},
        })
    } catch (error) {
        console.error('Error fetching task:', error)
        throw new Error('Failed to fetch task')
    }
}

export interface TaskCreateInput {
    ProjectID: number
    StatusID: number
    TaskName?: string | null
    DrawingNumber?: string | null
    DueDate?: Date | null
    ManufacturingRev?: string | null
    Operation: string
    ScheduledDueDate?: Date | null
    EstimatedHours?: number | null
    TaskTypeID?: number | null
    AssignedToID?: number | null
    DateStarted?: Date | null
    DateCompleted?: Date | null
    ManualDueDate?: number | null
    UpdateUserID?: string | null
    CurrentlyRunning?: number
    JobNumber?: string | null
}

export type TaskUpdateInput = Partial<TaskCreateInput>

export async function createTask(data: TaskCreateInput): Promise<TaskItem> {
    try {
        const now = new Date()
        const currentlyRunning = data.CurrentlyRunning ?? 0
        return await prisma.tblTask.create({
            select: taskSelect,
            data: {
                ...data,
                CurrentlyRunning: currentlyRunning,
                CreatedTimestamp: now,
                UpdatedTimestamp: now,
            },
        })
    } catch (error) {
        console.error('Error creating task:', error)
        throw new Error('Failed to create task')
    }
}

export async function updateTask(id: number, data: TaskUpdateInput): Promise<TaskItem | null> {
    try {
        return await prisma.tblTask.update({
            select: taskSelect,
            where: {ID: id},
            data: {
                ...data,
                UpdatedTimestamp: new Date(),
            },
        })
    } catch (error) {
        if (error instanceof PrismaNamespace.PrismaClientKnownRequestError && error.code === 'P2025') {
            return null
        }
        console.error('Error updating task:', error)
        throw new Error('Failed to update task')
    }
}
