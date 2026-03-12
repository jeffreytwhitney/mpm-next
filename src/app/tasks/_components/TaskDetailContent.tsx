import { notFound } from 'next/navigation'

import {getTaskById} from "@/app/actions/taskActions";

interface TaskDetailContentProps {
  taskId: number
}

function formatDate(value: Date | null | undefined) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

export async function TaskDetailContent({ taskId }: TaskDetailContentProps) {
  const task = await getTaskById(taskId)

  if (!task) {
    notFound()
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <div><span className="font-semibold">Task ID:</span> {task.ID}</div>
        <div><span className="font-semibold">Status ID:</span> {task.StatusID ?? '-'}</div>
        <div><span className="font-semibold">Ticket Number:</span> {task.TicketNumber ?? '-'}</div>
        <div><span className="font-semibold">Task Name:</span> {task.TaskName ?? '-'}</div>
        <div><span className="font-semibold">Drawing Number:</span> {task.DrawingNumber ?? '-'}</div>
        <div><span className="font-semibold">Operation:</span> {task.Operation ?? '-'}</div>
        <div><span className="font-semibold">Due Date:</span> {formatDate(task.DueDate)}</div>
        <div><span className="font-semibold">Scheduled Due Date:</span> {formatDate(task.ScheduledDueDate)}</div>
      </div>
    </div>
  )
}

