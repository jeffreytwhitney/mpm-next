import { TaskDetailContent } from '@/features/tasks/components/TaskDetailContent'
import TaskDetailModalShell from '@/app/tasks/_components/TaskDetailModalShell'
import {getTaskById} from "@/server/data/task"
import { parseTaskIdOrNotFound } from '@/app/tasks/_utils/parseParams'

interface TaskModalPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskModalPage({ params }: TaskModalPageProps) {
  const taskId = await parseTaskIdOrNotFound(params)
  const task = await getTaskById(taskId)


  return (
    <TaskDetailModalShell title={`Task '${task?.TaskName}' Details`}>
      <TaskDetailContent taskId={taskId} />
    </TaskDetailModalShell>
  )
}

