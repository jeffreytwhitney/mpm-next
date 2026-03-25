interface TicketTaskNewContentProps {
  ticketId: number
}

export default function TicketNewTaskContent({ ticketId }: TicketTaskNewContentProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Add-task flow for ticket <span className="font-semibold">#{ticketId}</span> will render here.
      </p>
      <p className="text-sm text-slate-500">
        The route wiring is in place for both child modal and full-page fallback so the real form can be added
        without changing navigation.
      </p>
    </div>
  )
}

