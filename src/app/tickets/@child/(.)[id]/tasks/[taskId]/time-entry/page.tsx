/**
 * AUTO-GENERATED MODULE DOC
 * App Router page module for '/tickets/@child/(.)[id]/tasks/[taskId]/time-entry'.
 */
import { notFound } from 'next/navigation'
import TaskChildModalShell from '@/app/tasks/_components/TaskChildModalShell'
import { TaskTimeEntryForm } from '@/features/tasks/components/TaskTimeEntryForm'
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'
import { getTaskById } from '@/server/data/task'

interface TicketTaskTimeEntryChildModalPageProps {
  params: Promise<{ id: string; taskId: string }>
}

export default async function TicketTaskTimeEntryChildModalPage({ params }: TicketTaskTimeEntryChildModalPageProps) {
  const ticketId = await parsePositiveIntParamOrNotFound(params)
  const taskId = await parsePositiveIntParamOrNotFound(params, 'taskId')
  const task = await getTaskById(taskId)

  if (!task || task.ProjectID !== ticketId) {
    notFound()
  }

  return (
    <TaskChildModalShell title="Add Time Entry" fallbackHref={`/tickets/${ticketId}/tasks/${taskId}`} zIndexClassName="z-70">
      <TaskTimeEntryForm taskId={taskId} closeOnSuccess />
    </TaskChildModalShell>
  )
}
