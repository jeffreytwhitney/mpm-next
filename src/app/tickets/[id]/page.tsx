import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'

interface TicketDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const ticketId = await parsePositiveIntParamOrNotFound(params)

  return (
	<div className="container mx-auto py-10">
	  <div className="rounded-md border bg-slate-50 p-4">
		<h1 className="mb-2 text-xl font-semibold">Ticket {ticketId} Details</h1>
		<p className="text-sm text-slate-500">
		  Ticket detail content for the standalone route will render here.
		</p>
	  </div>
	</div>
  )
}

