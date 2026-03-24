import {prisma} from "@/lib/prisma";
import type {Prisma} from "@/generated/prisma/client";
import {Prisma as PrismaNamespace} from "@/generated/prisma/client";
import {withErrorHandling} from "@/server/data/lib/errorHandling";
import {updateTicket} from "@/server/data/ticket";

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
    return withErrorHandling(
        () => prisma.tblTask.findFirst({
            select: taskSelect,
            where: {ID: id},
        }),
        'fetching task',
        'Failed to fetch task'
    )
}

export async function getTasksByProjectId(projectId: number): Promise<TaskItem[]> {
    return withErrorHandling(
        () => prisma.tblTask.findMany({
            select: taskSelect,
            where: {ProjectID: projectId},
        }),
        'fetching tasks by project',
        'Failed to fetch tasks'
    )
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
    const now = new Date()
    const currentlyRunning = data.CurrentlyRunning ?? 0
    const task = await withErrorHandling(
        () => prisma.tblTask.create({
            select: taskSelect,
            data: {
                ...data,
                CurrentlyRunning: currentlyRunning,
                CreatedTimestamp: now,
                UpdatedTimestamp: now,
            },
        }),
        'creating task',
        'Failed to create task'
    )

    // Update ticket/project active task count
    const activeTaskCount = await countActiveTasksByProjectId(data.ProjectID)
    await updateTicket(data.ProjectID, {
        CountOfActiveTasks: activeTaskCount,
    })

    return task
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
        throw error
    }
}

export async function checkExistingTask(taskName: string, operationNumber: string, taskTypeID:number): Promise<boolean> {
    const task = await prisma.tblTask.findFirst({
        select: { ID: true },
        where: {
            TaskName: taskName,
            Operation: operationNumber,
            TaskTypeID: taskTypeID,
        },
    })
    return (task != null)
}

export async function countActiveTasksByProjectId(projectId: number): Promise<number> {
    return withErrorHandling(
        () => prisma.tblTask.count({
            where: {
                ProjectID: projectId,
                StatusID: {
                    notIn: [4, 5], // Exclude Completed (4) and Canceled (5)
                },
            },
        }),
        'counting active tasks',
        'Failed to count active tasks'
    )
}
