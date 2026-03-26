/**
 * Ticket Detail Data Access Module
 *
 * Builds composite ticket detail models used by detail pages and forms.
 * Aggregates base ticket data, related task lists, and display-oriented names
 * needed by UI without requiring additional client-side fetches.
 *
 * Handles data resolution errors gracefully to ensure detail pages remain resilient
 * when optional identity links (submitter, engineers) are missing or inaccessible.
 */
import {
    getTicketRecordById,
    getQualityEngineerByTicketID,
    getManufacturingEngineerByTicketID,
    type TicketItem,
} from '@/server/data/ticket'
import { getDepartmentById } from '@/server/data/department'
import { getTaskListByProjectID, type TaskListItem } from '@/server/data/taskList'


export interface TicketDetailModel {
    ticket: TicketItem
    tasks: TaskListItem[]
    departmentName: string | null
    submitterName: string | null
    submitterEmail: string | null
    qualityEngineerName: string | null
    manufacturingEngineerName: string | null
}


/**
 * Builds the ticket detail payload used by detail pages/forms.
 *
 * Includes base ticket data, related task list, and display-oriented names
 * needed by UI without additional client fetches.
 */
export async function getTicketDetailById(ticketId: number): Promise<TicketDetailModel | null> {
    try {
        const ticket = await getTicketRecordById(ticketId)

        if (!ticket) {
            return null
        }

        const tasks = await getTaskListByProjectID(ticketId)

        const [department, submitter, qualityEngineer, manufacturingEngineer] = await Promise.all([
            getDepartmentById(ticket.DepartmentID),
            // Keep detail rendering resilient when optional identity links are missing.
            ticket.InitiatorEmployeeID ? getManufacturingEngineerByTicketID(ticketId).catch(() => null) : Promise.resolve(null),
            getQualityEngineerByTicketID(ticketId).catch(() => null),
            getManufacturingEngineerByTicketID(ticketId).catch(() => null),
        ])

        return {
            ticket,
            tasks,
            departmentName: department?.DepartmentName ?? null,
            submitterName: submitter?.FullName ?? null,
            submitterEmail: submitter?.EMailAddress ?? null,
            qualityEngineerName: qualityEngineer?.FullName ?? null,
            manufacturingEngineerName: manufacturingEngineer?.FullName ?? null,
        }
    } catch (error) {
        console.error('Error fetching ticket detail:', error)
        throw new Error('Failed to fetch ticket detail')
    }
}
