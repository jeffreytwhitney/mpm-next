import {prisma} from "@/lib/prisma";
import type {Prisma} from "@/generated/prisma/client";




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
    try {
        return await prisma.tblTaskTimeEntry.findFirst({
            select: taskTimeEntrySelect,
            where: {
                AssignedToID: assigneeID,
                EntryDate: entryDate,
            },
        })
    } catch (error) {
        console.error('Error fetching task time entry:', error)
        throw new Error('Failed to fetch task time entry')
    }
}

export async function getTaskTimeEntriesByTaskIDAndAssigneeID(taskID: number, assigneeID: number, ): Promise<TaskTimeItem[]> {
    try {
        return await prisma.tblTaskTimeEntry.findMany({
            select: taskTimeEntrySelect,
            where: {
                TaskID: taskID,
                AssignedToID: assigneeID,
            }
        })
    } catch (error) {
        console.error('Error fetching task time entries:', error)
        throw new Error('Failed to fetch task time entries')
    }
}

export async function getSumOfHoursByTaskID(taskID: number): Promise<number> {
    try {
        const result = await prisma.tblTaskTimeEntry.aggregate({
            _sum: { Hours: true },
            where: { TaskID: taskID },
        })
        return result._sum.Hours ?? 0
    } catch (error) {
        console.error('Error fetching sum of hours for task:', error)
        throw new Error('Failed to fetch sum of hours for task')
    }
}

export async function getSumOfHoursByTaskIDAndAssigneeID(taskID: number, assigneeID: number): Promise<number> {
    try {
        const result = await prisma.tblTaskTimeEntry.aggregate({
            _sum: { Hours: true },
            where: {
                TaskID: taskID,
                AssignedToID: assigneeID
            },
        })
        return result._sum.Hours ?? 0
    } catch (error) {
        console.error('Error fetching sum of hours for task:', error)
        throw new Error('Failed to fetch sum of hours for task')
    }
}

export async function createTaskTimeEntry(input: CreateTaskTimeEntry): Promise<TaskTimeItem> {
    try {
       const now = new Date()
       const existingTaskTimeEntry = await getTaskTimeEntryByDateAndAssigneeId(input.AssignedToID, input.EntryDate)

       if(existingTaskTimeEntry) {
           return await prisma.tblTaskTimeEntry.update({
               select: taskTimeEntrySelect,
               where: { ID: existingTaskTimeEntry.ID },
               data: {
                   Hours: (existingTaskTimeEntry.Hours ?? 0) + input.Hours,
                   UpdatedTimestamp: now
               }
           })
       }

       return await prisma.tblTaskTimeEntry.create({
           select: taskTimeEntrySelect,
           data: {
               AssignedToID: input.AssignedToID,
               EntryDate: input.EntryDate,
               TaskID: input.TaskID,
               Hours: input.Hours,
               CreatedTimestamp: now,
               UpdatedTimestamp: now,
           }
       })

    } catch (error) {
        console.error('Error creating task time entry:', error)
        throw new Error('Failed to create task time entry')
    }
}
