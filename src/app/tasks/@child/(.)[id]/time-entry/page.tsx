import TaskChildModalShell from '@/app/tasks/_components/TaskChildModalShell'
import { TaskTimeEntryForm } from '@/features/tasks/components/TaskTimeEntryForm'
import { parseTaskIdOrNotFound } from '@/app/tasks/_utils/parseParams'

interface TaskTimeEntryChildModalPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskTimeEntryChildModalPage({ params }: TaskTimeEntryChildModalPageProps) {
  const taskId = await parseTaskIdOrNotFound(params)

  return (
    <TaskChildModalShell title="Add Time Entry">
      <TaskTimeEntryForm taskId={taskId} closeOnSuccess />
    </TaskChildModalShell>
  )
}

