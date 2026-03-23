import TaskChildModalShell from '@/app/tasks/_components/TaskChildModalShell'
import { TaskNoteEntryForm } from '@/features/tasks/components/TaskNoteEntryForm'
import { parseTaskIdOrNotFound } from '@/app/tasks/_utils/parseParams'

interface TaskNoteChildModalPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskNoteChildModalPage({ params }: TaskNoteChildModalPageProps) {
  const taskId = await parseTaskIdOrNotFound(params)

  return (
    <TaskChildModalShell title="Add Note">
      <TaskNoteEntryForm taskId={taskId} closeOnSuccess />
    </TaskChildModalShell>
  )
}

