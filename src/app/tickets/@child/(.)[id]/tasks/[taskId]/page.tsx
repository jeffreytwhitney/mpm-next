/**
 * AUTO-GENERATED MODULE DOC
 * App Router page module for '/tickets/@child/(.)[id]/tasks/[taskId]'.
 */
import { notFound } from 'next/navigation'
import TaskDetailModalShell from '@/app/tasks/_components/TaskDetailModalShell'
import { TaskDetailContent } from '@/features/tasks/components/TaskDetailContent'
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'
import { getTaskById } from '@/server/data/task'

interface TicketTaskDetailChildModalPageProps {
  params: Promise<{ id: string; taskId: string }>
}

export default async function TicketTaskDetailChildModalPage({ params }: TicketTaskDetailChildModalPageProps) {
  const ticketId = await parsePositiveIntParamOrNotFound(params)
  const parsedTaskId = await parsePositiveIntParamOrNotFound(params, 'taskId')
  const task = await getTaskById(parsedTaskId)

  if (!task || task.ProjectID !== ticketId) {
    notFound()
  }

  return (
    <TaskDetailModalShell
      title={`Task '${task.TaskName ?? parsedTaskId}' Details`}
      side="left"
      zIndexClassName="z-60"
      fallbackHref={`/tickets/${ticketId}`}
    >
      <TaskDetailContent taskId={parsedTaskId} detailBasePath={`/tickets/${ticketId}/tasks/${parsedTaskId}`} />
    </TaskDetailModalShell>
  )
}
