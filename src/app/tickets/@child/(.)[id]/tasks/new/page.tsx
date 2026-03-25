import TicketNewTaskContent from '@/features/tickets/components/TicketNewTaskContent'
import TicketChildModalShell from '../../../../_components/TicketChildModalShell'
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'
import { notFound } from 'next/navigation'
import {getTicketById} from "@/server/data/ticket"

interface TicketNewTaskChildModalPageProps {
  params: Promise<{ id: string }>
}

export default async function TicketNewTaskChildModalPage({ params }: TicketNewTaskChildModalPageProps) {
  const ticketId = await parsePositiveIntParamOrNotFound(params)
  let ticket

  try {
    ticket = await getTicketById(ticketId)
  } catch {
    notFound()
  }

  const ticketNumber = ticket.ticket.TicketNumber ?? ''
  const ticketName = ticket.ticket.ProjectName ?? ''
  const ticketDescription = ticket.ticket.ProjectDescription ?? ''

  return (
    <TicketChildModalShell title="Add Task">
      <TicketNewTaskContent
        ticketId={ticketId}
        ticketNumber={ticketNumber}
        ticketName={ticketName}
        ticketDescription={ticketDescription}
      />
    </TicketChildModalShell>
  )
}
