import { notFound } from 'next/navigation'
import { TaskDetailContent } from '@/app/tasks/_components/TaskDetailContent'
import TaskDetailModalShell from '@/components/TaskDetailModalShell'
import {getTaskById} from "@/app/actions/taskActions";

interface TaskModalPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskModalPage({ params }: TaskModalPageProps) {
  const { id } = await params
  const taskId = Number(id)

  const task = await getTaskById(taskId)


  if (!Number.isInteger(taskId) || taskId <= 0) {
    notFound()
  }

  return (
    <TaskDetailModalShell title={`Task '${task?.TaskName}' Details`}>
      <TaskDetailContent taskId={taskId} />
    </TaskDetailModalShell>
  )
}

