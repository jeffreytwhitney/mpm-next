import TicketAddTaskForm from '@/features/tickets/components/TicketAddTaskForm'
import {getTaskTypeDropdownOptions} from '@/server/data/taskType'

interface TicketTaskNewContentProps {
    ticketId: number
    ticketNumber: string
    ticketName: string
    ticketDescription: string
}

export default async function TicketNewTaskContent({
    ticketId,
    ticketNumber,
    ticketName,
    ticketDescription,
}: TicketTaskNewContentProps) {
    const taskTypeOptions = await getTaskTypeDropdownOptions()

    return (
        <TicketAddTaskForm
            ticketId={ticketId}
            ticketNumber={ticketNumber}
            ticketName={ticketName}
            ticketDescription={ticketDescription}
            taskTypeOptions={taskTypeOptions}
        />
    )
}

