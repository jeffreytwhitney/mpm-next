/**
 * AUTO-GENERATED MODULE DOC
 * App Router page module for '/tasks/@child/(..)tickets/[id]/tasks/[taskId]/notes/new'.
 */
import { notFound } from 'next/navigation'
import TaskChildModalShell from '@/app/tasks/_components/TaskChildModalShell'
import { TaskNoteEntryForm } from '@/features/tasks/components/TaskNoteEntryForm'
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'
import { getTaskById } from '@/server/data/task'

interface TaskTicketTaskNoteChildModalPageProps {
  params: Promise<{ id: string; taskId: string }>
}

export default async function TaskTicketTaskNoteChildModalPage({
  params,
}: TaskTicketTaskNoteChildModalPageProps) {
  const ticketId = await parsePositiveIntParamOrNotFound(params)
  const taskId = await parsePositiveIntParamOrNotFound(params, 'taskId')
  const task = await getTaskById(taskId)

  if (!task || task.ProjectID !== ticketId) {
    notFound()
  }

  return (
    <TaskChildModalShell title="Add Note" fallbackHref={`/tickets/${ticketId}/tasks/${taskId}`} zIndexClassName="z-70">
      <TaskNoteEntryForm taskId={taskId} closeOnSuccess />
    </TaskChildModalShell>
  )
}

