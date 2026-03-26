/**
 * Ticket List Data Access Module
 *
 * Handles filtered, sorted, and paginated ticket queries used by ticket list views.
 * Supports filtering by ticket number, name, department, engineer assignments, and task names.
 * Enables customizable sorting, pagination, and completion status filtering.
 *
 * Optimizes queries with calculated fields and eager-loaded relationships to support
 * rich list UI without additional client-side queries.
 */
import {prisma} from '@/lib/prisma'
import type {Prisma} from '@/generated/prisma/client'
import {parseOptionalInt, parsePositiveIntOrDefault} from "@/server/data/lib/common";
import {resolveSiteID} from '@/lib/site'

export interface TicketListFilters {
    siteID: string
    showCompleted?: boolean
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
}

export type TicketListItem = Prisma.qryProjectListGetPayload<{ select: typeof projectListSelect }>
export type TicketListSearchParams = Partial<Record<keyof TicketListFilters, string>>
export interface TicketListResult { tasks: TicketListItem[], totalCount: number }

/// Parses URL search parameters into TaskListFilters, handling type conversions and defaults
/// This is because URL search parameters are always strings, but our filters expect specific types (e.g. numbers, enums)
export function parseTicketListFilters(searchParams: TicketListSearchParams, defaultSiteID = '1'): TicketListFilters {
    const showCompleted = searchParams.showCompleted === undefined
        ? undefined
        : searchParams.showCompleted === 'true'
            ? true
            : searchParams.showCompleted === 'false'
                ? false
                : undefined

    return {
        siteID: resolveSiteID(searchParams.siteID, defaultSiteID),
        showCompleted,
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
        const completedFilter = filters?.showCompleted === undefined
            ? undefined
            : filters.showCompleted
                ? {lte: 1}
                : {gt: 1}

        let projectIDsFromTaskSearch: number[] | undefined
        if (taskName) {
            const taskMatches = await prisma.tblTask.findMany({
                where: {
                    TaskName: {contains: taskName},
                    Project: {
                        SiteID: siteID,
                        ...(completedFilter && {CountOfActiveTasks: completedFilter}),
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
            ...(completedFilter && {CountOfActiveTasks: completedFilter}),
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
