import TicketTaskGroupEditContent from '../../../../../../features/tickets/components/TicketTaskGroupEditContent'
import TicketChildSlideOverShell from '../../../../_components/TicketChildSlideOverShell'
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'

interface TicketTaskGroupEditChildModalPageProps {
  params: Promise<{ id: string }>
}

export default async function TicketTaskGroupEditChildModalPage({ params }: TicketTaskGroupEditChildModalPageProps) {
  const ticketId = await parsePositiveIntParamOrNotFound(params)

  return (
    <TicketChildSlideOverShell title="Group Edit Ticket Tasks">
      <TicketTaskGroupEditContent ticketId={ticketId} />
    </TicketChildSlideOverShell>
  )
}

