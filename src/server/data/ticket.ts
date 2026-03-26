/**
 * Ticket Data Access Module
 *
 * Handles all server-side database operations for tickets (projects), including:
 * - Retrieving tickets by ID or list with filtering/sorting/pagination
 * - Creating and updating ticket records
 * - Accessing related ticket data (owners, initiators, engineers)
 * - Tracking active task counts per ticket
 *
 * All database operations use error handling middleware to ensure consistent
 * error reporting and graceful failure handling.
 */
import {prisma} from "@/lib/prisma";
import type {Prisma} from "@/generated/prisma/client";
import {Prisma as PrismaNamespace} from "@/generated/prisma/client";
import {getUserById, type MPMUser} from "@/server/data/user";
import {withErrorHandling} from "@/server/data/lib/errorHandling";
import {getTaskListByProjectID, type TaskListByProjectIDFilters, type TaskListItem} from "@/server/data/taskList";

const ticketSelect = {
    ID: true,
    SiteID: true,
    TicketNumber: true,
    ProjectName: true,
    ProjectDescription: true,
    DepartmentID: true,
    PrimaryProjectOwnerID: true,
    SecondaryProjectOwnerID: true,
    TertiaryProjectOwnerID: true,
    InitiatorEmployeeID: true,
    CountOfActiveTasks: true,
    CarbonCopyEmailList: true,
    RequiresModels: true,
    CreatedTimestamp: true,
    UpdatedTimestamp: true,
    UpdateUserID: true,
} satisfies Prisma.tblProjectSelect

export type TicketItem = Prisma.tblProjectGetPayload<{select: typeof ticketSelect}>

export interface TicketDetailModel {
    ticket: TicketItem
    tasks: TaskListItem[]
}

export async function getTicketRecordById(id: number): Promise<TicketItem | null> {
    return withErrorHandling(
        () => prisma.tblProject.findFirst({
            select: ticketSelect,
            where: {ID: id},
        }),
        'fetching ticket',
        'Failed to fetch ticket',
    )
}

export async function getTicketById(
    id: number,
    taskFilters?: Partial<TaskListByProjectIDFilters>,
): Promise<TicketDetailModel> {
    const ticket = await getTicketRecordById(id)
    if (!ticket) {
        throw new Error('Failed to fetch ticket')
    }
    const tasks = await getTaskListByProjectID(id, taskFilters)
    return {ticket, tasks}
}

export async function getQualityEngineerByTicketID(ticketID: number): Promise<MPMUser | null> {
    return withErrorHandling(
        async () => {
            const ticket = await prisma.tblProject.findFirst({
                select: {SecondaryProjectOwnerID: true},
                where: {ID: ticketID},
            })

            if (!ticket || ticket.SecondaryProjectOwnerID == null) {
                return null
            }

            return await getUserById(ticket.SecondaryProjectOwnerID)
        },
        'fetching quality engineer ticket',
        'Failed to fetch quality engineer by ticket ID'
    )
}

export async function getManufacturingEngineerByTicketID(ticketID: number): Promise<MPMUser | null> {
    return withErrorHandling(
        async () => {
            const ticket = await prisma.tblProject.findFirst({
                select: {PrimaryProjectOwnerID: true},
                where: {ID: ticketID},
            })

            if (!ticket || ticket.PrimaryProjectOwnerID == null) {
                return null
            }

            return await getUserById(ticket.PrimaryProjectOwnerID)
        },
        'fetching manufacturing engineer ticket',
        'Failed to fetch manufacturing engineer by ticket ID'
    )
}

export interface TicketCreateInput {
    SiteID: number
    TicketNumber?: string | null
    ProjectName: string
    ProjectDescription?: string | null
    DepartmentID: number
    PrimaryProjectOwnerID?: number | null
    SecondaryProjectOwnerID: number
    InitiatorEmployeeID: number
    CountOfActiveTasks?: number
    CarbonCopyEmailList?: string | null
    RequiresModels: number
}

export type TicketUpdateInput = Partial<TicketCreateInput>

export async function createTicket(data: TicketCreateInput): Promise<TicketItem> {
    const now = new Date()

    return withErrorHandling(
        () => prisma.tblProject.create({
            select: ticketSelect,
            data: {
                ...data,
                CreatedTimestamp: now,
                UpdatedTimestamp: now,
            },
        }),
        'creating ticket',
        'Failed to create ticket'
    )
}

export async function updateTicket(id: number, data: TicketUpdateInput): Promise<TicketItem | null> {
    try {
        return await prisma.tblProject.update({
            select: ticketSelect,
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

