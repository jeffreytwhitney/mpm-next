import { notFound } from 'next/navigation'
import TaskChildModalShell from '@/app/tasks/_components/TaskChildModalShell'
import { TaskNoteEntryForm } from '@/features/tasks/components/TaskNoteEntryForm'

interface TaskNoteChildModalPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskNoteChildModalPage({ params }: TaskNoteChildModalPageProps) {
  const { id } = await params
  const taskId = Number(id)

  if (!Number.isInteger(taskId) || taskId <= 0) {
    notFound()
  }

  return (
    <TaskChildModalShell title="Add Note">
      <TaskNoteEntryForm taskId={taskId} closeOnSuccess />
    </TaskChildModalShell>
  )
}

