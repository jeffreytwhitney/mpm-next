/**
 * AUTO-GENERATED MODULE DOC
 * Feature module for 'tickets' domain behavior.
 */
import {getTicketDetailById} from '@/server/data/ticketDetail'
import {notFound} from 'next/navigation'
import {
    getMetrologyUserDropdownOptions,
    getManufacturingEngineerDropdownOptions,
    getQualityEngineerDropdownOptions,
} from '@/server/data/user'
import {getTaskStatusDropdownOptions} from '@/server/data/taskStatus'
import {getTaskTypeDropdownOptions} from '@/server/data/taskType'
import {getCurrentUserRecord} from '@/lib/auth/currentUser'
import {canEditTicket} from '@/lib/auth/permissions'
import {TicketDetailForm} from './TicketDetailForm'

/**
 * Props for rendering ticket detail content from the server.
 */
interface TicketDetailContentProps {
    /** Numeric ticket identifier parsed from the route. */
    ticketID: number
    /** Optional caller override to disable form submission. */
    canSubmit?: boolean
}

/**
 * Server-side ticket detail loader used by both full-page and modal routes.
 *
 * This component centralizes data loading, dropdown option hydration,
 * and permission checks before handing control to the client form.
 */
export async function TicketDetailContent({ticketID, canSubmit = true}: TicketDetailContentProps) {
    const [ticketDetail, currentUser] = await Promise.all([
        getTicketDetailById(ticketID),
        getCurrentUserRecord(),
    ])

    if (!ticketDetail) {
        notFound()
    }

    const departmentID = ticketDetail.ticket.DepartmentID ?? 0
    const siteID = ticketDetail.ticket.SiteID ?? 1

    const [qualityEngineerOptions, manufacturingEngineerOptions, taskStatusOptions, taskTypeOptions, taskAssigneeOptions] = await Promise.all([
        // No department means there is nothing meaningful to query for engineer options.
        departmentID > 0
            ? getQualityEngineerDropdownOptions(departmentID)
            : Promise.resolve([]),
        departmentID > 0
            ? getManufacturingEngineerDropdownOptions(departmentID)
            : Promise.resolve([]),
        getTaskStatusDropdownOptions(),
        getTaskTypeDropdownOptions(),
        getMetrologyUserDropdownOptions(siteID),
    ])

    const canEdit = canSubmit && canEditTicket(currentUser, ticketDetail.ticket.DepartmentID)

    return (
        <TicketDetailForm
            ticketId={ticketID}
            ticketDetail={ticketDetail}
            qualityEngineerOptions={qualityEngineerOptions}
            manufacturingEngineerOptions={manufacturingEngineerOptions}
            taskStatusOptions={taskStatusOptions}
            taskTypeOptions={taskTypeOptions}
            taskAssigneeOptions={taskAssigneeOptions}
            canSubmit={canEdit}
        />
    )
}

