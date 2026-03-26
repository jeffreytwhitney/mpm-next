/**
 * AUTO-GENERATED MODULE DOC
 * App Router page module for '/tasks/@child/(.)[id]/time-entry'.
 */
import TaskChildModalShell from '@/app/tasks/_components/TaskChildModalShell'
import { TaskTimeEntryForm } from '@/features/tasks/components/TaskTimeEntryForm'
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'

interface TaskTimeEntryChildModalPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskTimeEntryChildModalPage({ params }: TaskTimeEntryChildModalPageProps) {
  const taskId = await parsePositiveIntParamOrNotFound(params)

  return (
    <TaskChildModalShell title="Add Time Entry">
      <TaskTimeEntryForm taskId={taskId} closeOnSuccess />
    </TaskChildModalShell>
  )
}

