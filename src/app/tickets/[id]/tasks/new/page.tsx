import TicketNewTaskContent from '@/features/tickets/components/TicketNewTaskContent'
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'
import {getTicketById} from '@/server/data/ticket'
import {notFound} from 'next/navigation'

interface TicketTaskNewPageProps {
  params: Promise<{ id: string }>
}

export default async function TicketTaskNewPage({ params }: TicketTaskNewPageProps) {
  const ticketId = await parsePositiveIntParamOrNotFound(params)
  let ticket

  try {
    ticket = await getTicketById(ticketId)
  } catch {
    notFound()
  }

  return (
	<div className="container mx-auto py-10">
	  <div className="rounded-md border bg-slate-50 p-4">
		<h1 className="mb-4 text-xl font-semibold">Add Tasks to Ticket {ticketId}</h1>
		<TicketNewTaskContent
		  ticketId={ticketId}
		  ticketNumber={ticket.ticket.TicketNumber ?? ''}
		  ticketName={ticket.ticket.ProjectName ?? ''}
		  ticketDescription={ticket.ticket.ProjectDescription ?? ''}
		/>
	  </div>
	</div>
  )
}

