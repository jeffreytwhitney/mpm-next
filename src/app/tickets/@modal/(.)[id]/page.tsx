/**
 * AUTO-GENERATED MODULE DOC
 * App Router page module for '/tickets/@modal/(.)[id]'.
 */
import { TicketDetailContent } from '@/features/tickets/components/TicketDetailContent'
import TicketDetailModalShell from '@/app/tickets/_components/TicketDetailModalShell'
import { notFound } from 'next/navigation'
import {getTicketRecordById} from "@/server/data/ticket"
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'

/** Route params for intercepted modal `/tickets/(.)[id]`. */
interface TicketModalPageProps {
    params: Promise<{ id: string }>
}

/**
 * Modal variant of the ticket detail route.
 *
 * Shares core detail content with the full page route while wrapping
 * it in a slide-over shell for in-context editing.
 */
export default async function TicketModalPage({ params }: TicketModalPageProps) {
    const ticketId = await parsePositiveIntParamOrNotFound(params)
    const ticket = await getTicketRecordById(ticketId)

    if (!ticket) {
        notFound()
    }


    return (
        <TicketDetailModalShell
            title={`Ticket '${ticket.TicketNumber}' Details`}
            panelWidthClassName="w-full sm:w-3/5 lg:w-2/3"
        >
            <TicketDetailContent ticketID={ticketId} />
        </TicketDetailModalShell>

    )
}

