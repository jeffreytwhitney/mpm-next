/**
 * AUTO-GENERATED MODULE DOC
 * App Router page module for '/tickets/[id]/tasks/[taskId]'.
 */
import { notFound } from 'next/navigation'
import { TaskDetailContent } from '@/features/tasks/components/TaskDetailContent'
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'
import { getTaskById } from '@/server/data/task'

interface TicketTaskDetailPageProps {
  params: Promise<{ id: string; taskId: string }>
}

export default async function TicketTaskDetailPage({ params }: TicketTaskDetailPageProps) {
  const ticketId = await parsePositiveIntParamOrNotFound(params)
  const parsedTaskId = await parsePositiveIntParamOrNotFound(params, 'taskId')
  const task = await getTaskById(parsedTaskId)

  if (!task || task.ProjectID !== ticketId) {
    notFound()
  }

  return (
    <div className="container mx-auto py-10">
      <div className="rounded-md border bg-slate-50 p-4">
        <h1 className="mb-4 text-xl font-semibold">Task {task.TaskName ?? parsedTaskId} Details</h1>
        <TaskDetailContent taskId={parsedTaskId} detailBasePath={`/tickets/${ticketId}/tasks/${parsedTaskId}`} />
      </div>
    </div>
  )
}
