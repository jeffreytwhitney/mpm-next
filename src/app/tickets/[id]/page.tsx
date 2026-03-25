import { notFound } from 'next/navigation'
import { TicketDetailContent } from '@/features/tickets/components/TicketDetailContent'
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'
import { getTicketRecordById } from '@/server/data/ticket'

interface TicketDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const ticketId = await parsePositiveIntParamOrNotFound(params)
  const ticket = await getTicketRecordById(ticketId)

  if (!ticket) {
	notFound()
  }

  return (
	<div className="container mx-auto py-10">
	  <div className="rounded-md border bg-slate-50 p-4">
		<h1 className="mb-4 text-xl font-semibold">Ticket {ticket.TicketNumber ?? ticketId} Details</h1>
		<TicketDetailContent ticketID={ticketId} />
	  </div>
	</div>
  )
}

