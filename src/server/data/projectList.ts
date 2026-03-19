import {prisma} from '@/lib/prisma'
import type {Prisma} from '@/generated/prisma/client'
import {parseOptionalInt, parsePositiveIntOrDefault} from "@/server/data/lib/common";
import {resolveSiteID} from '@/lib/site'
import {TaskStatusPreset, UnassignedPreset} from "@/server/data/taskList";

export interface ProjectListFilters {
    siteID: string
    ticketNumber?: string
    ticketName?: string
    taskName?: string
    departmentID?: number
    submittedByID?: number
    qualityEngineerID?: number
    showCompleted: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    page?: number
    pageSize?: number
}


// Define the select object to be reused
const projectListSelect = {
    ID: true,
    TicketNumber: true,
    ProjectName: true,
    CreatedTimestamp: true,
    DepartmentName: true,
    InitiatorName: true,
    DepartmentID: true,
} satisfies Prisma.qryProjectListSelect

const sortFieldMap: Record<string, keyof typeof projectListSelect> = {
    TicketNumber: 'TicketNumber',
    TaskName: 'TaskName',
    ProjectName: 'ProjectName',
    Status: 'Status',
    DepartmentName: 'DepartmentName',
    ticketNumber: 'TicketNumber',
    taskName: 'TaskName',
    projectName: 'ProjectName',
    status: 'Status',
    dueDate: 'DueDate',
    departmentName: 'DepartmentName',
    scheduledDueDate: 'ScheduledDueDate',
    taskType: 'TaskType',
    assignedToName: 'AssignedToName',
    AssignedToName: 'AssignedToName',
}