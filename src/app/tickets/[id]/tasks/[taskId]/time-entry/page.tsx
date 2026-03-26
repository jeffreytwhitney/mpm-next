/**
 * AUTO-GENERATED MODULE DOC
 * App Router page module for '/tickets/[id]/tasks/[taskId]/time-entry'.
 */
import { notFound } from 'next/navigation'
import { TaskTimeEntryForm } from '@/features/tasks/components/TaskTimeEntryForm'
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'
import { getTaskById } from '@/server/data/task'

interface TicketTaskTimeEntryPageProps {
  params: Promise<{ id: string; taskId: string }>
}

export default async function TicketTaskTimeEntryPage({ params }: TicketTaskTimeEntryPageProps) {
  const ticketId = await parsePositiveIntParamOrNotFound(params)
  const taskId = await parsePositiveIntParamOrNotFound(params, 'taskId')
  const task = await getTaskById(taskId)

  if (!task || task.ProjectID !== ticketId) {
    notFound()
  }

  return (
    <div className="container mx-auto py-10">
      <div className="rounded-md border bg-slate-50 p-4">
        <h1 className="mb-4 text-xl font-semibold">Log Time for Task {task.TaskName ?? taskId}</h1>
        <TaskTimeEntryForm taskId={taskId} />
      </div>
    </div>
  )
}
