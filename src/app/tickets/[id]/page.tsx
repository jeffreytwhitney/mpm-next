/**
 * AUTO-GENERATED MODULE DOC
 * App Router page module for '/tickets/[id]'.
 */
import { notFound } from 'next/navigation'
import { TicketDetailContent } from '@/features/tickets/components/TicketDetailContent'
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'
import { getTicketRecordById } from '@/server/data/ticket'

/** Route params for `/tickets/[id]`. */
interface TicketDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * Full-page ticket detail route.
 *
 * This route provides a page-level shell and delegates shared detail
 * loading + form rendering to `TicketDetailContent`.
 */
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

