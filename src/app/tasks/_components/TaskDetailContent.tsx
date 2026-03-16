import { notFound } from 'next/navigation'
import { getTaskById } from '@/server/data/task'
import { getProjectById } from '@/server/data/project'
import { getTaskStatusDropdownOptions } from '@/server/data/taskStatus'
import { updateTask } from '@/app/tasks/_actions/updateTask'

interface TaskDetailContentProps {
  taskId: number
}

function formatDate(value: Date | null | undefined) {
  if (!value) return ''
  return new Date(value).toLocaleString()
}

export async function TaskDetailContent({ taskId }: TaskDetailContentProps) {
  const task = await getTaskById(taskId)

  if (!task) {
    notFound()
  }

  const [project, statusOptions] = await Promise.all([
    task.ProjectID != null ? getProjectById(task.ProjectID) : null,
    getTaskStatusDropdownOptions(),
  ])

  if (!project) {
    notFound()
  }

  const selectedStatusValue = task.StatusID != null ? String(task.StatusID) : ''
  const updateTaskAction = updateTask.bind(null, taskId)

  return (
    <form action={updateTaskAction} className="space-y-4 text-sm">
      <div className="grid grid-cols-[12rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2">
        <label htmlFor="statusId" className="font-semibold">Status</label>
        <select
          id="statusId"
          name="statusId"
          defaultValue={selectedStatusValue}
          className="w-full rounded border border-gray-300 bg-white px-2 py-1"
        >
          {statusOptions.map((status) => (
            <option key={status.value} value={String(status.value)}>
              {status.label}
            </option>
          ))}
        </select>


        <span className="font-semibold">Task Name</span>
        <span>{task.TaskName ?? '-'}</span>

        <span className="font-semibold">Drawing Number</span>
        <span>{task.DrawingNumber ?? '-'}</span>

        <span className="font-semibold">Operation</span>
        <span>{task.Operation ?? '-'}</span>

        <span className="font-semibold">Due Date</span>
        <span>{formatDate(task.DueDate)}</span>

        <span className="font-semibold">Scheduled Due Date</span>
        <span>{formatDate(task.ScheduledDueDate)}</span>
      </div>

      <div>
        <button
          type="submit"
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </form>
  )
}
