import {prisma} from '@/lib/prisma'
import type {Prisma} from '@/generated/prisma/client'

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

export interface TaskStatusOption {
    value: number
    label: string
}

export type TaskStatusPreset = 'activeNotWaiting'

export async function getTaskList(filters?: {
    statusID?: number
    statusPreset?: TaskStatusPreset
    ticketNumber?: string
    ticketName?: string
    assignedToID?: number
    taskName?: string
    projectName?: string
    departmentID?: number
    submittedByName?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    page?: number
    pageSize?: number
}): Promise<TaskListItem[]> {
    try {
        const pageSize = filters?.pageSize ?? 50
        const page = filters?.page ?? 1
        const skip = (page - 1) * pageSize

        // Map sort column names to actual DB columns
        const sortFieldMap: Record<string, keyof typeof taskListSelect> = {
            'TicketNumber': 'TicketNumber',
            'TaskName': 'TaskName',
            'ProjectName': 'ProjectName',
            'Status': 'Status',
            'DueDate': 'DueDate',
            'DepartmentName': 'DepartmentName',
            'ticketNumber': 'TicketNumber',
            'taskName': 'TaskName',
            'projectName': 'ProjectName',
            'status': 'Status',
            'dueDate': 'DueDate',
            'departmentName': 'DepartmentName',
        }

        const sortField = filters?.sortBy ? (sortFieldMap[filters.sortBy] ?? 'DueDate') : 'DueDate'
        const sortOrder = filters?.sortOrder ?? 'asc'
        const statusFilter = filters?.statusID !== undefined
            ? filters.statusID
            : filters?.statusPreset === 'activeNotWaiting'
                ? {lt: 3}
                : {lt: 4}

        return await prisma.qryTaskList.findMany({
            select: taskListSelect,
            where: {
                StatusID: statusFilter,
                ...(filters?.ticketNumber && {TicketNumber: {contains: filters.ticketNumber}}),
                ...(filters?.assignedToID && {AssignedToID: filters.assignedToID}),
                ...(filters?.taskName && {TaskName: {contains: filters.taskName}}),
                ...(filters?.projectName && {ProjectName: {contains: filters.projectName}}),
                ...(filters?.departmentID && {DepartmentID: filters.departmentID}),
                ...(filters?.submittedByName && {SubmittedByName: filters.submittedByName}),
            },
            orderBy: {
                [sortField]: sortOrder,
            },
            take: pageSize,
            skip: skip,
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

