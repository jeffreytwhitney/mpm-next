import { AddNewTicketContent } from '@/features/tickets/components/AddNewTicketContent';

export default async function NewTicketPage() {
    return (
        <div className="container mx-auto py-10">
            <div className="rounded-md border bg-slate-50 p-4">
                <h1 className="mb-4 text-xl font-semibold">New Ticket</h1>
                <AddNewTicketContent />
            </div>
        </div>
    );
}
