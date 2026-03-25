import TicketNewTaskContent from '@/features/tickets/components/TicketNewTaskContent'
import TicketChildModalShell from '../../../../_components/TicketChildModalShell'
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'
import { notFound } from 'next/navigation'
import {getTicketRecordById} from "@/server/data/ticket"

interface TicketNewTaskChildModalPageProps {
  params: Promise<{ id: string }>
}

export default async function TicketNewTaskChildModalPage({ params }: TicketNewTaskChildModalPageProps) {
  const ticketId = await parsePositiveIntParamOrNotFound(params)
  const ticket = await getTicketRecordById(ticketId)

  if (!ticket) {
    notFound()
  }

  return (
    <TicketChildModalShell title="Add Task">
      <TicketNewTaskContent
        ticketId={ticketId}
        ticketNumber={ticket.TicketNumber ?? ''}
        ticketName={ticket.ProjectName ?? ''}
        ticketDescription={ticket.ProjectDescription ?? ''}
      />
    </TicketChildModalShell>
  )
}
