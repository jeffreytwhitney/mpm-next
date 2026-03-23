import { TaskTimeEntryForm } from '@/features/tasks/components/TaskTimeEntryForm'
import { parseTaskIdOrNotFound } from '@/app/tasks/_utils/parseParams'

interface TaskTimeEntryPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskTimeEntryPage({ params }: TaskTimeEntryPageProps) {
  const taskId = await parseTaskIdOrNotFound(params)

  return (
    <div className="container mx-auto py-10">
      <div className="rounded-md border bg-slate-50 p-4">
        <h1 className="mb-4 text-xl font-semibold">Add Time to Task {taskId}</h1>
        <TaskTimeEntryForm taskId={taskId} />
      </div>
    </div>
  )
}

