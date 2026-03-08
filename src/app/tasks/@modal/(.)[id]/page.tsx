import { notFound } from 'next/navigation'
import { TaskDetailContent } from '@/app/tasks/_components/TaskDetailContent'
import TaskDetailModalShell from '@/components/TaskDetailModalShell'

interface TaskModalPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskModalPage({ params }: TaskModalPageProps) {
  const { id } = await params
  const taskId = Number(id)

  if (!Number.isInteger(taskId) || taskId <= 0) {
    notFound()
  }

  return (
    <TaskDetailModalShell title={`Task ${taskId} Details`}>
      <TaskDetailContent taskId={taskId} />
    </TaskDetailModalShell>
  )
}

