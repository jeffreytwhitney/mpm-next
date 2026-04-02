import NewTicketModalShell from '@/app/tickets/_components/NewTicketModalShell'
import {AddNewTicketContent} from '@/features/tickets/components/AddNewTicketContent'

/**
 * Intercepted modal variant of `/tickets/new`.
 *
 * Keeps the tickets list in view while rendering the add-ticket form
 * in a slide-over shell.
 */
export default async function NewTicketModalPage() {
	return (
		<NewTicketModalShell
			title="New Ticket"
			panelWidthClassName="w-full sm:w-3/5 lg:w-2/3"
		>
			<AddNewTicketContent />
		</NewTicketModalShell>
	)
}

