/**
 * AUTO-GENERATED MODULE DOC
 * App Router page module for '/tickets/[id]/tasks/group-edit'.
 */
import TicketTaskGroupEditContent from '@/features/tickets/components/TicketTaskGroupEditContent'
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'

interface TicketTaskGroupEditPageProps {
  params: Promise<{ id: string }>
}

export default async function TicketTaskGroupEditPage({ params }: TicketTaskGroupEditPageProps) {
  const ticketId = await parsePositiveIntParamOrNotFound(params)

  return (
	<div className="container mx-auto py-10">
	  <div className="rounded-md border bg-slate-50 p-4">
		<h1 className="mb-4 text-xl font-semibold">Group Edit Tasks for Ticket {ticketId}</h1>
		<TicketTaskGroupEditContent ticketId={ticketId} />
	  </div>
	</div>
  )
}

