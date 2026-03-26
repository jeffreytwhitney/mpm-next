/**
 * AUTO-GENERATED MODULE DOC
 * App Router page module for '/tickets/[id]/tasks/new'.
 */
import TicketAddTaskContent from '@/features/tickets/components/TicketAddTaskContent'
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'
import {getTicketRecordById} from '@/server/data/ticket'
import {notFound} from 'next/navigation'

interface TicketTaskNewPageProps {
  params: Promise<{ id: string }>
}

export default async function TicketTaskNewPage({ params }: TicketTaskNewPageProps) {
  const ticketId = await parsePositiveIntParamOrNotFound(params)
  const ticket = await getTicketRecordById(ticketId)

  if (!ticket) {
    notFound()
  }

  return (
	<div className="container mx-auto py-10">
	  <div className="rounded-md border bg-slate-50 p-4">
		<h1 className="mb-4 text-xl font-semibold">Add Tasks to Ticket {ticketId}</h1>
		<TicketAddTaskContent
		  ticketId={ticketId}
		  ticketNumber={ticket.TicketNumber ?? ''}
		  ticketName={ticket.ProjectName ?? ''}
		  ticketDescription={ticket.ProjectDescription ?? ''}
		/>
	  </div>
	</div>
  )
}

