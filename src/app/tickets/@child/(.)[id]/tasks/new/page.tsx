import TicketNewTaskContent from '../../../../_components/TicketNewTaskContent'
import TicketChildModalShell from '../../../../_components/TicketChildModalShell'
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'

interface TicketTaskNewChildModalPageProps {
  params: Promise<{ id: string }>
}

export default async function TicketTaskNewChildModalPage({ params }: TicketTaskNewChildModalPageProps) {
  const ticketId = await parsePositiveIntParamOrNotFound(params)

  return (
    <TicketChildModalShell title="Add Tasks to Ticket">
      <TicketNewTaskContent ticketId={ticketId} />
    </TicketChildModalShell>
  )
}

