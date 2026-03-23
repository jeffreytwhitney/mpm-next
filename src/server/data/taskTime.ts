import {prisma} from "@/lib/prisma";
import type {Prisma} from "@/generated/prisma/client";
import {withErrorHandling} from "@/server/data/lib/errorHandling";

const taskTimeEntrySelect = {
    ID: true,
    AssignedToID: true,
    EntryDate: true,
    TaskID: true,
    Hours: true,
    CreatedTimestamp: true,
    UpdatedTimestamp: true
} satisfies Prisma.tblTaskTimeEntrySelect

export interface CreateTaskTimeEntry {
    AssignedToID: number,
    EntryDate: Date,
    TaskID: number,
    Hours: number
}

export type TaskTimeItem = Prisma.tblTaskTimeEntryGetPayload<{select: typeof taskTimeEntrySelect}>

export async function getTaskTimeEntryByDateAndAssigneeId(assigneeID: number, entryDate: Date = new Date()): Promise<TaskTimeItem | null> {
    return withErrorHandling(
        () => prisma.tblTaskTimeEntry.findFirst({
            select: taskTimeEntrySelect,
            where: {
                AssignedToID: assigneeID,
                EntryDate: entryDate,
            },
        }),
        'fetching task time entry',
        'Failed to fetch task time entry'
    )
}

export async function getTaskTimeEntriesByTaskIDAndAssigneeID(taskID: number, assigneeID: number, ): Promise<TaskTimeItem[]> {
    return withErrorHandling(
        () => prisma.tblTaskTimeEntry.findMany({
            select: taskTimeEntrySelect,
            where: {
                TaskID: taskID,
                AssignedToID: assigneeID,
            }
        }),
        'fetching task time entries',
        'Failed to fetch task time entries'
    )
}

export async function getSumOfHoursByTaskID(taskID: number): Promise<number> {
    const result = await withErrorHandling(
        () => prisma.tblTaskTimeEntry.aggregate({
            _sum: { Hours: true },
            where: { TaskID: taskID },
        }),
        'fetching sum of hours',
        'Failed to fetch sum of hours for task'
    )
    return result._sum.Hours ?? 0
}

export async function getSumOfHoursByTaskIDAndAssigneeID(taskID: number, assigneeID: number): Promise<number> {
    const result = await withErrorHandling(
        () => prisma.tblTaskTimeEntry.aggregate({
            _sum: { Hours: true },
            where: {
                TaskID: taskID,
                AssignedToID: assigneeID
            },
        }),
        'fetching sum of hours by assignee',
        'Failed to fetch sum of hours for task'
    )
    return result._sum.Hours ?? 0
}

export async function createTaskTimeEntry(input: CreateTaskTimeEntry): Promise<TaskTimeItem> {
    const now = new Date()
    const existingTaskTimeEntry = await getTaskTimeEntryByDateAndAssigneeId(input.AssignedToID, input.EntryDate)

    if(existingTaskTimeEntry) {
        return withErrorHandling(
            () => prisma.tblTaskTimeEntry.update({
                select: taskTimeEntrySelect,
                where: { ID: existingTaskTimeEntry.ID },
                data: {
                    Hours: (existingTaskTimeEntry.Hours ?? 0) + input.Hours,
                    UpdatedTimestamp: now
                }
            }),
            'updating task time entry',
            'Failed to create task time entry'
        )
    }

    return withErrorHandling(
        () => prisma.tblTaskTimeEntry.create({
            select: taskTimeEntrySelect,
            data: {
                AssignedToID: input.AssignedToID,
                EntryDate: input.EntryDate,
                TaskID: input.TaskID,
                Hours: input.Hours,
                CreatedTimestamp: now,
                UpdatedTimestamp: now,
            }
        }),
        'creating task time entry',
        'Failed to create task time entry'
    )
}
