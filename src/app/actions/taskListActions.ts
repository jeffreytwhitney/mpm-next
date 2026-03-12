import {prisma} from '@/lib/prisma'
import type {Prisma} from '@/generated/prisma/client'
import {parseOptionalInt, parsePositiveIntOrDefault} from "@/app/actions/lib/common";

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
    TaskType: true,
    TaskTypeID: true,
} satisfies Prisma.qryTaskListRawSelect

// Export the return type for use in components
export type TaskListItem = Prisma.qryTaskListRawGetPayload<{select: typeof taskListSelect}>




export type TaskStatusPreset = 'activeNotWaiting'
export type UnassignedPreset = 'unAssigned'

export interface TaskListFilters {
    statusID?: number
    statusPreset?: TaskStatusPreset
    unassignedPreset?: UnassignedPreset
    ticketNumber?: string
    ticketName?: string
    assignedToID?: number
    taskName?: string
    projectName?: string
    departmentID?: number
    taskTypeID?: number
    submittedByName?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    page?: number
    pageSize?: number
}

export type TaskListSearchParams = Partial<Record<keyof TaskListFilters, string>>

/// Parses URL search parameters into TaskListFilters, handling type conversions and defaults
/// This is because URL search parameters are always strings, but our filters expect specific types (e.g. numbers, enums)
export function parseTaskListFilters(searchParams: TaskListSearchParams): TaskListFilters {
    const statusPreset: TaskStatusPreset | undefined =
        searchParams.statusPreset === 'activeNotWaiting' ? 'activeNotWaiting' : undefined
    const unassignedPreset: UnassignedPreset | undefined =
        searchParams.unassignedPreset === 'unAssigned' ? 'unAssigned' : undefined

    return {
        statusID: parseOptionalInt(searchParams.statusID),
        statusPreset,
        unassignedPreset,
        ticketNumber: searchParams.ticketNumber,
        ticketName: searchParams.ticketName,
        assignedToID: parseOptionalInt(searchParams.assignedToID),
        taskName: searchParams.taskName,
        projectName: searchParams.projectName,
        departmentID: parseOptionalInt(searchParams.departmentID),
        taskTypeID: parseOptionalInt(searchParams.taskTypeID),
        submittedByName: searchParams.submittedByName,
        sortBy: searchParams.sortBy,
        sortOrder: searchParams.sortOrder === 'desc' ? 'desc' : 'asc',
        page: parsePositiveIntOrDefault(searchParams.page, 1),
        pageSize: parsePositiveIntOrDefault(searchParams.pageSize, 25),
    }
}

export async function getTaskList(filters?: TaskListFilters): Promise<TaskListItem[]> {
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
            'taskTypeID': 'TaskTypeID',
        }

        const sortField = filters?.sortBy ? (sortFieldMap[filters.sortBy] ?? 'DueDate') : 'DueDate'
        const sortOrder = filters?.sortOrder ?? 'asc'
        const statusFilter = filters?.statusID !== undefined
            ? filters.statusID
            : filters?.statusPreset === 'activeNotWaiting'
                ? {lt: 3}
                : {lt: 4}
        const assigneeFilter = filters?.unassignedPreset === 'unAssigned'
            ? null
            : filters?.assignedToID !== undefined
                ? filters.assignedToID
                : undefined
            

        return await prisma.qryTaskListRaw.findMany({
            select: taskListSelect,
            where: {
                StatusID: statusFilter,
                ...(filters?.ticketNumber && {TicketNumber: {contains: filters.ticketNumber}}),
                ...(assigneeFilter !== undefined && {AssignedToID: assigneeFilter}),
                ...(filters?.taskName && {TaskName: {contains: filters.taskName}}),
                ...(filters?.projectName && {ProjectName: {contains: filters.projectName}}),
                ...(filters?.departmentID !== undefined && {DepartmentID: filters.departmentID}),
                ...(filters?.submittedByName && {SubmittedByName: filters.submittedByName}),
                ...(filters?.taskTypeID && {TaskTypeID: filters.taskTypeID}),
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

