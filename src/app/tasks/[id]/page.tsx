import { notFound } from 'next/navigation'
import { TaskDetailContent } from '@/app/tasks/_components/TaskDetailContent'

interface TaskDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params
  const taskId = Number(id)

  if (!Number.isInteger(taskId) || taskId <= 0) {
    notFound()
  }

  return (
    <div className="container mx-auto py-10">
      <div className="rounded-md border bg-slate-50 p-4 dark:bg-slate-900">
        <h1 className="mb-4 text-xl font-semibold">Task {taskId} Details</h1>
        <TaskDetailContent taskId={taskId} />
      </div>
    </div>
  )
}

