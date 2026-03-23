import { TaskDetailContent } from '@/features/tasks/components/TaskDetailContent'
import { parseTaskIdOrNotFound } from '@/app/tasks/_utils/parseParams'

interface TaskDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const taskId = await parseTaskIdOrNotFound(params)

  return (
    <div className="container mx-auto py-10">
      <div className="rounded-md border bg-slate-50 p-4">
        <h1 className="mb-4 text-xl font-semibold">Task {taskId} Details</h1>
        <TaskDetailContent taskId={taskId} />
      </div>
    </div>
  )
}

