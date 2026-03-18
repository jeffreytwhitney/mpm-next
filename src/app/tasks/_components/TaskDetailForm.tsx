'use client'

import { useActionState, useEffect, useState } from 'react'
import { updateTask } from '@/app/tasks/_actions/updateTask'
import {
    INITIAL_UPDATE_TASK_STATE,
    type UpdateTaskFieldErrors,
} from '@/app/tasks/_actions/updateTaskTypes'
import { TASK_DETAIL_SAVED_EVENT } from '@/lib/taskDetailEvents'
import { isRevertingToNotStarted } from '@/lib/taskStatusTransition'
import type { TaskDetailModel } from '@/server/data/taskDetail'
import type { TaskStatusDropdownOption } from '@/server/data/taskStatus'
import type { UserDropDownOption } from '@/server/data/user'

interface TaskDetailFormProps {
    taskId: number
    taskDetail: TaskDetailModel
    statusOptions: TaskStatusDropdownOption[]
    assigneeOptions: UserDropDownOption[]
    canSubmit: boolean
    isMetrologyProgrammer: boolean
}

type FieldErrors = UpdateTaskFieldErrors

function toDateInputValue(value: Date | null | undefined) {
    if (!value) return ''
    return new Date(value).toISOString().split('T')[0]
}

function validateForm(
    formData: FormData,
    task: TaskDetailModel['task'],
    isMetrologyProgrammer: boolean
): FieldErrors {
    const errors: FieldErrors = {}
    const submittedStatusRaw = formData.get('statusId')?.toString().trim() ?? ''
    const submittedStatusId = Number(submittedStatusRaw)
    const submittedAssigneeRaw = formData.get('assigneeID')?.toString().trim() ?? ''
    const submittedAssigneeID = Number(submittedAssigneeRaw);

    if (!formData.get('taskName')?.toString().trim()) {
        errors.taskName = 'Task name is required.'
    }
    if (isMetrologyProgrammer && !formData.get('statusId')?.toString().trim()) {
        errors.statusId = 'Status is required.'
    }

    if (isMetrologyProgrammer && submittedStatusRaw.length > 0) {
        if (!Number.isInteger(submittedStatusId)) {
            errors.statusId = 'Status is invalid.'
        } else if (isRevertingToNotStarted(task.StatusID, submittedStatusId)) {
            errors.statusId = 'Cannot move a Started or Waiting task back to Not Started.'
        }
    }

    if (isMetrologyProgrammer) {
        if (submittedStatusId > 0 && !submittedAssigneeID) {
            errors.assigneeID = 'Cannot have a status other than Not Started without an assignee.'
        }
        if (!Number.isInteger(submittedAssigneeID)) {
            errors.assigneeID = 'Assignee is invalid.'
        }
        if (task.AssignedToID && !submittedAssigneeID){
            errors.assigneeID = 'Cannot remove assignee once assigned.'
        }
    }
    if (!formData.get('manufacturingRev')?.toString().trim()) {
        errors.manufacturingRev = 'Rev is required.'
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
    taskDetail,
    statusOptions,
    assigneeOptions,
    canSubmit,
    isMetrologyProgrammer,
}: TaskDetailFormProps) {
    const { task, project } = taskDetail
    const [errors, setErrors] = useState<FieldErrors>({})
    const [serverState, updateTaskAction, isPending] = useActionState(
        updateTask.bind(null, taskId),
        INITIAL_UPDATE_TASK_STATE,
    )

    useEffect(() => {
        if (!serverState.success) {
            return
        }

        window.dispatchEvent(new CustomEvent(TASK_DETAIL_SAVED_EVENT, { detail: { taskId } }))
    }, [serverState.success, taskId])

    const selectedStatusValue = task.StatusID != null ? String(task.StatusID) : ''
    const selectedAssigneeValue = task.AssignedToID != null ? String(task.AssignedToID) : ''
    const displayErrors: FieldErrors = {
        ...serverState.fieldErrors,
        ...errors,
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        const formData = new FormData(e.currentTarget)
        const fieldErrors = validateForm(formData, task, isMetrologyProgrammer)

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

                <span className="font-semibold pt-1">Ticket Name</span>
                <span className="pt-1">{project.ProjectName ?? ''}</span>

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
                    {displayErrors.taskName && (
                        <p className="mt-0.5 text-xs text-red-600">{displayErrors.taskName}</p>
                    )}
                </div>

                {/* Task Name */}
                <label htmlFor="manufacturingRev" className="font-semibold pt-1">
                    Rev {canSubmit && <span className="text-red-500">*</span>}
                </label>
                <div>
                    <input
                        id="manufacturingRev"
                        name="manufacturingRev"
                        defaultValue={task.ManufacturingRev ?? ''}
                        disabled={!canSubmit}
                        className="rounded border border-gray-300 bg-white px-2 py-1 w-52 disabled:bg-gray-100"
                        suppressHydrationWarning
                    />
                    {displayErrors.manufacturingRev && (
                        <p className="mt-0.5 text-xs text-red-600">{displayErrors.manufacturingRev}</p>
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
                    {displayErrors.opNumber && (
                        <p className="mt-0.5 text-xs text-red-600">{displayErrors.opNumber}</p>
                    )}
                </div>

                <span className="font-semibold pt-1">Job Number</span>
                <span className="pt-1">{taskDetail.jobNumber ?? ''}</span>

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
                    {displayErrors.statusId && (
                        <p className="mt-0.5 text-xs text-red-600">{displayErrors.statusId}</p>
                    )}
                </div>

                {/* Assignee */}
                <label htmlFor="assigneeId" className="font-semibold pt-1">
                    Assignee
                </label>
                <div>
                    {isMetrologyProgrammer ? (
                        <select
                            id="assigneeID"
                            name="assigneeID"
                            defaultValue={selectedAssigneeValue}
                            className="rounded border border-gray-300 bg-white px-2 py-1 w-52"
                            suppressHydrationWarning
                        >
                            {assigneeOptions.map((assignee) => (
                                <option key={assignee.value} value={String(assignee.value)}>
                                    {assignee.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <>
                            {/* Preserve current status value for non-editable users */}
                            <input type="hidden" name="assigneeID" value={selectedAssigneeValue} suppressHydrationWarning />
                            <span className="pt-1">
                                {assigneeOptions.find((s) => String(s.value) === selectedAssigneeValue)?.label ?? ''}
                            </span>
                        </>
                    )}
                    {displayErrors.assigneeID && (
                        <p className="mt-0.5 text-xs text-red-600">{displayErrors.assigneeID}</p>
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
                    {displayErrors.dueDate && (
                        <p className="mt-0.5 text-xs text-red-600">{displayErrors.dueDate}</p>
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
                    {displayErrors.scheduledDueDate && (
                        <p className="mt-0.5 text-xs text-red-600">{displayErrors.scheduledDueDate}</p>
                    )}
                </div>

                {/* Manual Due Date */}
                <label htmlFor="manualDueDate" className="font-semibold pt-1">
                    Manual Due Date
                </label>
                <div className="pt-1">
                    <input
                        type="checkbox"
                        id="manualDueDate"
                        name="manualDueDate"
                        defaultChecked={(task.ManualDueDate ?? 0) === 1}
                        disabled={!canSubmit}
                        className="h-4 w-4 rounded border-gray-300 disabled:opacity-50"
                        suppressHydrationWarning
                    />
                </div>
                
                <span className="font-semibold pt-1">Date Started</span>
                <span className="pt-1">
                    {task.DateStarted ? new Date(task.DateStarted).toLocaleDateString('en-US') : ''}
                </span>

                {(task.StatusID === 4 || task.StatusID === 5) && (
                    <>
                        <span className="font-semibold pt-1">Date Completed</span>
                        <span className="pt-1">
                            {task.DateCompleted ? new Date(task.DateCompleted).toLocaleDateString('en-US') : ''}
                        </span>
                    </>
                )}

                <span className="font-semibold pt-1">Total Tracked Hours</span>
                <span className="pt-1">{taskDetail.totalTrackedHours ?? '0'}</span>

                <span className="font-semibold pt-1">Department</span>
                <span className="pt-1">{taskDetail.departmentName ?? ''}</span>

                <span className="font-semibold pt-1">Quality Engineer</span>
                <span className="pt-1">{taskDetail.qualityEngineerName ?? ''}</span>

                <span className="font-semibold pt-1">Manufacturing Engineer</span>
                <span className="pt-1">{taskDetail.manufacturingEngineerName ?? ''}</span>

            </div>



            {serverState.formError && (
                <p className="text-sm text-red-600">{serverState.formError}</p>
            )}

            {canSubmit && (
                <div>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                    >
                        {isPending ? 'Saving...' : 'Save'}
                    </button>
                </div>
            )}
        </form>
    )
}
