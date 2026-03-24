import {prisma} from '@/lib/prisma'
import type {Prisma} from '@/generated/prisma/client'
import {parseOptionalInt, parsePositiveIntOrDefault} from "@/server/data/lib/common";
import {resolveSiteID} from '@/lib/site'

export interface TicketListFilters {
    siteID: string
    ticketNumber?: string
    ticketName?: string
    departmentID?: number
    qualityEngineerID?: number
    submittorID?: number
    taskName?: string
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
    ProjectDescription: true,
    DepartmentName: true,
    CountOfActiveTasks: true,
    PrimaryOwnerName: true,
    SecondaryOwnerName: true,
    InitiatorName: true,
    CreatedTimestamp: true,

} satisfies Prisma.qryProjectListSelect

const sortFieldMap: Record<string, keyof typeof projectListSelect> = {
    TicketNumber: 'TicketNumber',
    ProjectName: 'ProjectName',
    DepartmentName: 'DepartmentName',
    CountOfActiveTasks: 'CountOfActiveTasks',
    PrimaryOwnerName: 'PrimaryOwnerName',
    SecondaryOwnerName: 'SecondaryOwnerName',
    InitiatorName: 'InitiatorName',
    CreatedTimestamp: 'CreatedTimestamp',
    ticketNumber: 'TicketNumber',
    ticketName: 'ProjectName',
    departmentName: 'DepartmentName',
    countOfActiveTasks: 'CountOfActiveTasks',
    primaryOwnerName: 'PrimaryOwnerName',
    secondaryOwnerName: 'SecondaryOwnerName',
    initiatorName: 'InitiatorName',
    createdTimestamp: 'CreatedTimestamp',
}

export type TicketListItem = Prisma.qryProjectListGetPayload<{ select: typeof projectListSelect }>
export type TicketListSearchParams = Partial<Record<keyof TicketListFilters, string>>
export interface TicketListResult { tasks: TicketListItem[], totalCount: number }

/// Parses URL search parameters into TaskListFilters, handling type conversions and defaults
/// This is because URL search parameters are always strings, but our filters expect specific types (e.g. numbers, enums)
export function parseTicketListFilters(searchParams: TicketListSearchParams, defaultSiteID = '1'): TicketListFilters {

    return {
        siteID: resolveSiteID(searchParams.siteID, defaultSiteID),
        ticketNumber: searchParams.ticketNumber,
        ticketName: searchParams.ticketName,
        departmentID: parseOptionalInt(searchParams.departmentID),
        qualityEngineerID: parseOptionalInt(searchParams.qualityEngineerID),
        submittorID: parseOptionalInt(searchParams.submittorID),
        taskName: searchParams.taskName,
        sortBy: searchParams.sortBy,
        sortOrder: searchParams.sortOrder === 'desc' ? 'desc' : 'asc',
        page: parsePositiveIntOrDefault(searchParams.page, 1),
        pageSize: parsePositiveIntOrDefault(searchParams.pageSize, 25),
    }
}

export async function getTicketList(filters?: Partial<TicketListFilters>): Promise<TicketListResult> {
    try {
        const siteID = parseOptionalInt(filters?.siteID) ?? 1
        const pageSize = filters?.pageSize ?? 25
        const page = filters?.page ?? 1
        const skip = (page - 1) * pageSize

        const sortField = filters?.sortBy ? (sortFieldMap[filters.sortBy] ?? 'TicketNumber') : 'TicketNumber'
        const sortOrder = filters?.sortOrder ?? 'asc'
        const taskName = filters?.taskName?.trim()

        let projectIDsFromTaskSearch: number[] | undefined
        if (taskName) {
            const taskMatches = await prisma.tblTask.findMany({
                where: {
                    TaskName: {contains: taskName},
                    Project: {
                        SiteID: siteID,
                        CountOfActiveTasks: {gt: 1},
                    },
                },
                select: {ProjectID: true},
                distinct: ['ProjectID'],
            })

            projectIDsFromTaskSearch = taskMatches.map((task) => task.ProjectID)

            if (projectIDsFromTaskSearch.length === 0) {
                return {tasks: [], totalCount: 0}
            }
        }

        const whereClause: Prisma.qryProjectListWhereInput = {
            SiteID: siteID,
            ...(filters?.ticketNumber && {TicketNumber: {contains: filters.ticketNumber}}),
            ...(filters?.ticketName && {ProjectName: {contains: filters.ticketName}}),
            ...(filters?.departmentID !== undefined && {DepartmentID: filters.departmentID}),
            ...(filters?.qualityEngineerID !== undefined && {SecondaryProjectOwnerID: filters.qualityEngineerID}),
            ...(filters?.submittorID !== undefined && {InitiatorEmployeeID: filters.submittorID}),
            ...(projectIDsFromTaskSearch && {ID: {in: projectIDsFromTaskSearch}}),
        }

        const [tasks, totalCount] = await Promise.all([
            prisma.qryProjectList.findMany({
                select: projectListSelect,
                where: whereClause,
                orderBy: {
                    [sortField]: sortOrder,
                },
                take: pageSize,
                skip: skip,
            }),
            prisma.qryProjectList.count({
                where: whereClause,
            }),
        ])

        return {tasks, totalCount}
    } catch (error) {
        console.error('Error fetching tickets:', error)
        throw new Error('Failed to fetch tickets')
    }
}