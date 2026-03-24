import { TaskDetailContent } from '@/features/tasks/components/TaskDetailContent'
import TaskDetailModalShell from '@/app/tasks/_components/TaskDetailModalShell'
import {getTaskById} from "@/server/data/task"
import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'

interface TaskModalPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskModalPage({ params }: TaskModalPageProps) {
  const taskId = await parsePositiveIntParamOrNotFound(params)
  const task = await getTaskById(taskId)


  return (
    <TaskDetailModalShell title={`Task '${task?.TaskName}' Details`}>
      <TaskDetailContent taskId={taskId} />
    </TaskDetailModalShell>
  )
}

