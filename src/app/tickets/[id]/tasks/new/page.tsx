import TicketNewTaskContent from '@/app/tickets/_components/TicketNewTaskContent'
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'

interface TicketTaskNewPageProps {
  params: Promise<{ id: string }>
}

export default async function TicketTaskNewPage({ params }: TicketTaskNewPageProps) {
  const ticketId = await parsePositiveIntParamOrNotFound(params)

  return (
	<div className="container mx-auto py-10">
	  <div className="rounded-md border bg-slate-50 p-4">
		<h1 className="mb-4 text-xl font-semibold">Add Tasks to Ticket {ticketId}</h1>
		<TicketNewTaskContent ticketId={ticketId} />
	  </div>
	</div>
  )
}

