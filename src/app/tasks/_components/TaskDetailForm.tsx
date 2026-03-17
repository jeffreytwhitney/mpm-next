'use client'

import { useState } from 'react'
import { updateTask } from '@/app/tasks/_actions/updateTask'
import type { TaskItem } from '@/server/data/task'
import type { ProjectItem } from '@/server/data/project'
import type { TaskStatusDropdownOption } from '@/server/data/taskStatus'

interface TaskDetailFormProps {
    taskId: number
    task: TaskItem
    project: ProjectItem
    statusOptions: TaskStatusDropdownOption[]
    canSubmit: boolean
    isMetrologyProgrammer: boolean
}

type FieldErrors = Partial<Record<'taskName' | 'statusId' | 'opNumber' | 'dueDate' | 'scheduledDueDate', string>>

function toDateInputValue(value: Date | null | undefined) {
    if (!value) return ''
    return new Date(value).toISOString().split('T')[0]
}

function validateForm(formData: FormData, isMetrologyProgrammer: boolean): FieldErrors {
    const errors: FieldErrors = {}

    if (!formData.get('taskName')?.toString().trim()) {
        errors.taskName = 'Task name is required.'
    }
    if (isMetrologyProgrammer && !formData.get('statusId')?.toString().trim()) {
        errors.statusId = 'Status is required.'
    }
    if (!formData.get('opNumber')?.toString().trim()) {
        errors.opNumber = 'Op number is required.'
    }
    if (!formData.get('dueDate')?.toString().trim()) {
        errors.dueDate = 'Due date is required.'
    }
    if (!formData.get('scheduledDueDate')?.toString().trim()) {
        errors.scheduledDueDate = 'Scheduled due date is required.'
    }

    return errors
}

export function TaskDetailForm({
    taskId,
    task,
    project,
    statusOptions,
    canSubmit,
    isMetrologyProgrammer,
}: TaskDetailFormProps) {
    const [errors, setErrors] = useState<FieldErrors>({})
    const updateTaskAction = updateTask.bind(null, taskId)

    const selectedStatusValue = task.StatusID != null ? String(task.StatusID) : ''

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        const formData = new FormData(e.currentTarget)
        const fieldErrors = validateForm(formData, isMetrologyProgrammer)

        if (Object.keys(fieldErrors).length > 0) {
            e.preventDefault()
            setErrors(fieldErrors)
        } else {
            setErrors({})
        }
    }

    return (
        <form action={updateTaskAction} onSubmit={handleSubmit} className="space-y-4 text-sm" suppressHydrationWarning>
            <div className="grid grid-cols-[12rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2">
                <span className="font-semibold pt-1">Ticket Number</span>
                <span className="pt-1">{project.TicketNumber ?? ''}</span>

                <span className="font-semibold pt-1">Ticket Description:</span>
                <span className="pt-1">{project.ProjectDescription ?? ''}</span>

                {/* Task Name */}
                <label htmlFor="taskName" className="font-semibold pt-1">
                    Task Name {canSubmit && <span className="text-red-500">*</span>}
                </label>
                <div>
                    <input
                        id="taskName"
                        name="taskName"
                        defaultValue={task.TaskName ?? ''}
                        disabled={!canSubmit}
                        className="rounded border border-gray-300 bg-white px-2 py-1 w-52 disabled:bg-gray-100"
                        suppressHydrationWarning
                    />
                    {errors.taskName && (
                        <p className="mt-0.5 text-xs text-red-600">{errors.taskName}</p>
                    )}
                </div>

                {/* Status */}
                <label htmlFor="statusId" className="font-semibold pt-1">
                    Status {canSubmit && isMetrologyProgrammer && <span className="text-red-500">*</span>}
                </label>
                <div>
                    {isMetrologyProgrammer ? (
                        <select
                            id="statusId"
                            name="statusId"
                            defaultValue={selectedStatusValue}
                            className="rounded border border-gray-300 bg-white px-2 py-1 w-52"
                            suppressHydrationWarning
                        >
                            {statusOptions.map((status) => (
                                <option key={status.value} value={String(status.value)}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <>
                            {/* Preserve current status value for non-editable users */}
                            <input type="hidden" name="statusId" value={selectedStatusValue} suppressHydrationWarning />
                            <span className="pt-1">
                                {statusOptions.find((s) => String(s.value) === selectedStatusValue)?.label ?? '-'}
                            </span>
                        </>
                    )}
                    {errors.statusId && (
                        <p className="mt-0.5 text-xs text-red-600">{errors.statusId}</p>
                    )}
                </div>

                {/* Drawing Number */}
                <label htmlFor="drawingNumber" className="font-semibold pt-1">DrawingNumber</label>
                <input
                    id="drawingNumber"
                    name="drawingNumber"
                    defaultValue={task.DrawingNumber ?? ''}
                    disabled={!canSubmit}
                    className="rounded border border-gray-300 bg-white px-2 py-1 w-52 disabled:bg-gray-100"
                    suppressHydrationWarning
                />

                {/* Op Number */}
                <label htmlFor="opNumber" className="font-semibold pt-1">
                    Op Number {canSubmit && <span className="text-red-500">*</span>}
                </label>
                <div>
                    <input
                        id="opNumber"
                        name="opNumber"
                        defaultValue={task.Operation ?? ''}
                        disabled={!canSubmit}
                        className="rounded border border-gray-300 bg-white px-2 py-1 w-52 disabled:bg-gray-100"
                        suppressHydrationWarning
                    />
                    {errors.opNumber && (
                        <p className="mt-0.5 text-xs text-red-600">{errors.opNumber}</p>
                    )}
                </div>

                {/* Due Date */}
                <label htmlFor="dueDate" className="font-semibold pt-1">
                    Due Date {canSubmit && <span className="text-red-500">*</span>}
                </label>
                <div>
                    <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        defaultValue={toDateInputValue(task.DueDate)}
                        disabled={!canSubmit}
                        className="rounded border border-gray-300 bg-white px-2 py-1 w-52 disabled:bg-gray-100"
                        suppressHydrationWarning
                    />
                    {errors.dueDate && (
                        <p className="mt-0.5 text-xs text-red-600">{errors.dueDate}</p>
                    )}
                </div>

                {/* Scheduled Due Date */}
                <label htmlFor="scheduledDueDate" className="font-semibold pt-1">
                    Scheduled Due Date {canSubmit && <span className="text-red-500">*</span>}
                </label>
                <div>
                    <input
                        type="date"
                        id="scheduledDueDate"
                        name="scheduledDueDate"
                        defaultValue={toDateInputValue(task.ScheduledDueDate)}
                        disabled={!canSubmit}
                        className="rounded border border-gray-300 bg-white px-2 py-1 w-52 disabled:bg-gray-100"
                        suppressHydrationWarning
                    />
                    {errors.scheduledDueDate && (
                        <p className="mt-0.5 text-xs text-red-600">{errors.scheduledDueDate}</p>
                    )}
                </div>
            </div>

            {canSubmit && (
                <div>
                    <button
                        type="submit"
                        className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Save
                    </button>
                </div>
            )}
        </form>
    )
}
