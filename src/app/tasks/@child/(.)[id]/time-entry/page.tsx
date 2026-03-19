import { notFound } from 'next/navigation'
import TaskChildModalShell from '@/app/tasks/_components/TaskChildModalShell'
import { TaskTimeEntryForm } from '@/features/tasks/components/TaskTimeEntryForm'

interface TaskTimeEntryChildModalPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskTimeEntryChildModalPage({ params }: TaskTimeEntryChildModalPageProps) {
  const { id } = await params
  const taskId = Number(id)

  if (!Number.isInteger(taskId) || taskId <= 0) {
    notFound()
  }

  return (
    <TaskChildModalShell title="Add Time Entry">
      <TaskTimeEntryForm taskId={taskId} closeOnSuccess />
    </TaskChildModalShell>
  )
}

