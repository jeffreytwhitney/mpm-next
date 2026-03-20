import {prisma} from '@/lib/prisma'
import type {Prisma} from '@/generated/prisma/client'
import {parseOptionalInt, parsePositiveIntOrDefault} from "@/server/data/lib/common";
import {resolveSiteID} from '@/lib/site'


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
    SiteID: true,
    TicketNumber: true,
    ProjectName: true,
    ProjectDescription: true,
    DepartmentID: true,
    DepartmentName: true,
    PrimaryProjectOwnerID: true,
    PrimaryOwnerName: true,
    SecondaryProjectOwnerID: true,
    SecondaryOwnerName: true,
    CarbonCopyEmailList: true,
    RequiresModels: true,
    InitiatorName: true,
    QualityEngineerEmailAddress: true,
    CreatedTimestamp: true,
    CountOfActiveTasks: true,
} satisfies Prisma.qryProjectListSelect

const sortFieldMap: Record<string, keyof typeof projectListSelect> = {
    SiteID: 'SiteID',
    TicketNumber: 'TicketNumber',
    ProjectName: 'ProjectName',
    DepartmentName: 'DepartmentName',
    PrimaryProjectOwnerID: 'PrimaryProjectOwnerID',
    SecondaryOwnerName: 'SecondaryOwnerName',
    InitiatorName: 'InitiatorName',
    CreatedTimestamp: 'CreatedTimestamp',
}


// Export the return type for use in components
export type ProjectListItem = Prisma.qryProjectListGetPayload<{ select: typeof projectListSelect }>

export type ProjectListSearchParams = Partial<Record<keyof ProjectListFilters, string>>

export interface ProjectListResult {
    tasks: ProjectListItem[]
    totalCount: number
}

/// Parses URL search parameters into TaskListFilters, handling type conversions and defaults
/// This is because URL search parameters are always strings, but our filters expect specific types (e.g. numbers, enums)
export function parseProjectListFilters(searchParams: ProjectListSearchParams, defaultSiteID = '1'): ProjectListFilters {
    return {
        siteID: resolveSiteID(searchParams.siteID, defaultSiteID),
        ticketNumber: searchParams.ticketNumber,
        ticketName: searchParams.ticketName,
        taskName: searchParams.taskName,
        departmentID: parseOptionalInt(searchParams.departmentID),
        submittedByID: parseOptionalInt(searchParams.submittedByID),
        qualityEngineerID: parseOptionalInt(searchParams.qualityEngineerID),
        showCompleted: searchParams.showCompleted === 'true',
        sortBy: searchParams.sortBy,
        sortOrder: searchParams.sortOrder === 'desc' ? 'desc' : 'asc',
        page: parsePositiveIntOrDefault(searchParams.page, 1),
        pageSize: parsePositiveIntOrDefault(searchParams.pageSize, 25),
    }
}

export async function getProjectList(filters?: Partial<ProjectListFilters>): Promise<ProjectListResult> {
    try {
        const siteID = parseOptionalInt(filters?.siteID) ?? 1
        const pageSize = filters?.pageSize ?? 25
        const page = filters?.page ?? 1
        const skip = (page - 1) * pageSize

        const sortField = filters?.sortBy ? (sortFieldMap[filters.sortBy] ?? 'CreatedTimestamp') : 'CreatedTimestamp'
        const sortOrder = filters?.sortOrder ?? 'asc'

        // showCompleted=true → show finished projects (CountOfActiveTasks = 0)
        // showCompleted=false (default) → show active projects (CountOfActiveTasks > 0)
        const activeTasksFilter = filters?.showCompleted
            ? { equals: 0 }
            : { gt: 0 }

        const normalizedTaskName = filters?.taskName?.trim()
        let matchingProjectIDs: number[] | undefined

        if (normalizedTaskName) {
            const taskMatches = await prisma.tblTask.findMany({
                where: {
                    TaskName: {contains: normalizedTaskName},
                },
                select: {
                    ProjectID: true,
                },
                distinct: ['ProjectID'],
            })

            matchingProjectIDs = taskMatches.map((task) => task.ProjectID)

            if (matchingProjectIDs.length === 0) {
                return {tasks: [], totalCount: 0}
            }
        }

        const whereClause = {
            SiteID: siteID,
            CountOfActiveTasks: activeTasksFilter,
            ...(matchingProjectIDs && {ID: {in: matchingProjectIDs}}),
            ...(filters?.ticketNumber && { TicketNumber: { contains: filters.ticketNumber } }),
            ...(filters?.ticketName && { ProjectName: { contains: filters.ticketName } }),
            ...(filters?.departmentID !== undefined && { DepartmentID: filters.departmentID }),
        }

        const [projects, totalCount] = await Promise.all([
            prisma.qryProjectList.findMany({
                select: projectListSelect,
                where: whereClause,
                orderBy: {
                    [sortField]: sortOrder,
                },
                take: pageSize,
                skip,
            }),
            prisma.qryProjectList.count({
                where: whereClause,
            }),
        ])

        return { tasks: projects, totalCount }
    } catch (error) {
        console.error('Error fetching project list:', error)
        throw new Error('Failed to fetch project list')
    }
}
