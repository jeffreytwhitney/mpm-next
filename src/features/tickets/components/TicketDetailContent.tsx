import {getTicketDetailById} from '@/server/data/ticketDetail'
import {notFound} from 'next/navigation'
import {
    getManufacturingEngineerDropdownOptions,
    getQualityEngineerDropdownOptions,
} from '@/server/data/user'
import {getCurrentUserRecord} from '@/lib/auth/currentUser'
import {canEditTicket} from '@/lib/auth/permissions'
import {TicketDetailForm} from './TicketDetailForm'

interface TicketDetailContentProps {
    ticketID: number
    canSubmit?: boolean
}

export async function TicketDetailContent({ticketID, canSubmit = true}: TicketDetailContentProps) {
    const [ticketDetail, currentUser] = await Promise.all([
        getTicketDetailById(ticketID),
        getCurrentUserRecord(),
    ])

    if (!ticketDetail) {
        notFound()
    }

    const departmentID = ticketDetail.ticket.DepartmentID ?? 0

    const [qualityEngineerOptions, manufacturingEngineerOptions] = await Promise.all([
        departmentID > 0
            ? getQualityEngineerDropdownOptions(departmentID)
            : Promise.resolve([]),
        departmentID > 0
            ? getManufacturingEngineerDropdownOptions(departmentID)
            : Promise.resolve([]),
    ])

    const canEdit = canSubmit && canEditTicket(currentUser, ticketDetail.ticket.DepartmentID)

    return (
        <TicketDetailForm
            ticketId={ticketID}
            ticketDetail={ticketDetail}
            qualityEngineerOptions={qualityEngineerOptions}
            manufacturingEngineerOptions={manufacturingEngineerOptions}
            canSubmit={canEdit}
        />
    )
}

