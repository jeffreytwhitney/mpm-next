/**
 * AUTO-GENERATED MODULE DOC
 * App Router page module for '/tasks/@child/(.)[id]/notes/new'.
 */
import TaskChildModalShell from '@/app/tasks/_components/TaskChildModalShell'
import { TaskNoteEntryForm } from '@/features/tasks/components/TaskNoteEntryForm'
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'

interface TaskNoteChildModalPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskNoteChildModalPage({ params }: TaskNoteChildModalPageProps) {
  const taskId = await parsePositiveIntParamOrNotFound(params)

  return (
    <TaskChildModalShell title="Add Note">
      <TaskNoteEntryForm taskId={taskId} closeOnSuccess />
    </TaskChildModalShell>
  )
}

