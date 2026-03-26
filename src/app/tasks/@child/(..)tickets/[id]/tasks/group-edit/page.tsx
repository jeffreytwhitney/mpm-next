/**
 * AUTO-GENERATED MODULE DOC
 * App Router page module for '/tasks/@child/(..)tickets/[id]/tasks/group-edit'.
 */
import TicketTaskGroupEditContent from '@/features/tickets/components/TicketTaskGroupEditContent'
import TicketChildSlideOverShell from '@/app/tickets/_components/TicketChildSlideOverShell'
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'

interface TaskTicketTaskGroupEditChildModalPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskTicketTaskGroupEditChildModalPage({
  params,
}: TaskTicketTaskGroupEditChildModalPageProps) {
  const ticketId = await parsePositiveIntParamOrNotFound(params)

  return (
    <TicketChildSlideOverShell title="Group Edit Ticket Tasks">
      <TicketTaskGroupEditContent ticketId={ticketId} />
    </TicketChildSlideOverShell>
  )
}

