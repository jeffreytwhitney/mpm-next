import { TaskNoteEntryForm } from '@/features/tasks/components/TaskNoteEntryForm'
import { parseTaskIdOrNotFound } from '@/app/tasks/_utils/parseParams'

interface TaskNotePageProps {
  params: Promise<{ id: string }>
}

export default async function TaskNotePage({ params }: TaskNotePageProps) {
  const taskId = await parseTaskIdOrNotFound(params)

  return (
    <div className="container mx-auto py-10">
      <div className="rounded-md border bg-slate-50 p-4">
        <h1 className="mb-4 text-xl font-semibold">Add Note to Task {taskId}</h1>
        <TaskNoteEntryForm taskId={taskId} />
      </div>
    </div>
  )
}

