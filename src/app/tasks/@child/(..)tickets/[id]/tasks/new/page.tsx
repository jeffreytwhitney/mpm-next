/**
 * AUTO-GENERATED MODULE DOC
 * App Router page module for '/tasks/@child/(..)tickets/[id]/tasks/new'.
 */
import TicketAddTaskContent from '@/features/tickets/components/TicketAddTaskContent'
import TicketChildModalShell from '@/app/tickets/_components/TicketChildModalShell'
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'
import { notFound } from 'next/navigation'
import { getTicketRecordById } from '@/server/data/ticket'

interface TaskTicketNewTaskChildModalPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskTicketNewTaskChildModalPage({ params }: TaskTicketNewTaskChildModalPageProps) {
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

