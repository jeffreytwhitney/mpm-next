/**
 * AUTO-GENERATED MODULE DOC
 * App Router page module for '/tickets/@child/(.)[id]/tasks/new'.
 */
import TicketAddTaskContent from '@/features/tickets/components/TicketAddTaskContent'
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
      <TicketAddTaskContent
        ticketId={ticketId}
        ticketNumber={ticket.TicketNumber ?? ''}
        ticketName={ticket.ProjectName ?? ''}
        ticketDescription={ticket.ProjectDescription ?? ''}
      />
    </TicketChildModalShell>
  )
}
