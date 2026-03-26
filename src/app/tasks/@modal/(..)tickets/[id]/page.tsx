/**
 * AUTO-GENERATED MODULE DOC
 * App Router page module for '/tasks/@modal/(..)tickets/[id]'.
 */
import { TicketDetailContent } from '@/features/tickets/components/TicketDetailContent'
import TicketDetailModalShell from '@/app/tickets/_components/TicketDetailModalShell'
import { notFound } from 'next/navigation'
import { getTicketRecordById } from '@/server/data/ticket'
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'

interface TaskTicketModalPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskTicketModalPage({ params }: TaskTicketModalPageProps) {
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

