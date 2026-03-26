'use client'

/**
 * AUTO-GENERATED MODULE DOC
 * Feature module for 'tasks' domain behavior.
 */
import {useActionState, useEffect, useState} from 'react'
import Link from 'next/link'
import {updateTask} from '@/features/tasks/actions/updateTaskAction'
import {
    INITIAL_UPDATE_TASK_STATE,
    type UpdateTaskFieldErrors,
} from '@/features/tasks/actions/taskActionTypes'
import {
    isActiveTaskStatus,
    isRevertingToNotStarted,
    TASK_STATUS_CANCELLED_ID,
    TASK_STATUS_COMPLETED_ID,
    TASK_STATUS_WAITING_ID,
} from '@/features/tasks/taskStatusTransition'
import type {TaskDetailModel} from '@/server/data/taskDetail'
import type {TaskNoteItem} from '@/server/data/taskNote'
import type {TaskStatusDropdownOption} from '@/server/data/taskStatus'
import type {UserDropDownOption} from '@/server/data/user'

const TASK_DETAIL_SAVED_EVENT = 'task-detail:saved'

interface TaskDetailFormProps {
    taskId: number
    taskDetail: TaskDetailModel
    statusOptions: TaskStatusDropdownOption[]
    assigneeOptions: UserDropDownOption[]
    canSubmit: boolean
    isMetrologyProgrammer: boolean
    taskNotes: TaskNoteItem[]
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

        const isTaskCurrentlyActive = isActiveTaskStatus(task.StatusID)
        const isMarkingWaiting = submittedStatusId === TASK_STATUS_WAITING_ID && task.StatusID !== TASK_STATUS_WAITING_ID
        const isMarkingCancelled = isTaskCurrentlyActive && submittedStatusId === TASK_STATUS_CANCELLED_ID

        if (isMarkingWaiting && !formData.get('waitingReason')?.toString().trim()) {
            errors.waitingReason = 'Please select a waiting reason.'
        }
        if (isMarkingWaiting && formData.get('waitingReason')?.toString() === 'other' && !formData.get('waitingNote')?.toString().trim()) {
            errors.waitingNote = 'Waiting note is required when selecting "Other".'
        }
        if (isMarkingCancelled && !formData.get('cancelledNote')?.toString().trim()) {
            errors.cancelledNote = 'Cancelled note is required when setting status to Cancelled.'
        }
    }

    if (isMetrologyProgrammer) {
        if (submittedStatusId > 0 && !submittedAssigneeID) {
            errors.assigneeID = 'Cannot have a status other than Not Started without an assignee.'
        }
        if (!Number.isInteger(submittedAssigneeID)) {
            errors.assigneeID = 'Assignee is invalid.'
        }
        if (task.AssignedToID && !submittedAssigneeID) {
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
                                   taskNotes,
                               }: TaskDetailFormProps) {
    const {task, ticket} = taskDetail
    const [selectedStatusId, setSelectedStatusId] = useState<number>(task.StatusID)
    const [waitingReason, setWaitingReason] = useState<string>('')
    const [errors, setErrors] = useState<FieldErrors>({})
    const [isNotesCollapsed, setIsNotesCollapsed] = useState<boolean>(true)
    const [serverState, updateTaskAction, isPending] = useActionState(
        updateTask.bind(null, taskId),
        INITIAL_UPDATE_TASK_STATE,
    )

    useEffect(() => {
        if (!serverState.success) {
            return
        }

        window.dispatchEvent(new CustomEvent(TASK_DETAIL_SAVED_EVENT, {detail: {taskId}}))
    }, [serverState.success, taskId])

    const selectedStatusValue = task.StatusID != null ? String(task.StatusID) : ''
    const selectedAssigneeValue = task.AssignedToID != null ? String(task.AssignedToID) : ''
    const isTaskCurrentlyActive = isActiveTaskStatus(task.StatusID)
    const isMarkingWaiting = isMetrologyProgrammer && selectedStatusId === TASK_STATUS_WAITING_ID && task.StatusID !== TASK_STATUS_WAITING_ID
    const isMarkingCancelled = isMetrologyProgrammer && isTaskCurrentlyActive && selectedStatusId === TASK_STATUS_CANCELLED_ID
    const isMarkingCompleted = isMetrologyProgrammer && isTaskCurrentlyActive && selectedStatusId === TASK_STATUS_COMPLETED_ID
    const isTaskCompletedOrCancelled = task.StatusID === TASK_STATUS_COMPLETED_ID || task.StatusID === TASK_STATUS_CANCELLED_ID
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
        <>
            <div className="-mt-4 mb-4">
                <div className="flex flex-wrap justify-end gap-2">
                    <Link
                        href={`/tasks/${taskId}/notes/new`}
                        className="rounded border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-100 flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Add note
                    </Link>
                    {(isMetrologyProgrammer) && (
                    <Link
                        href={`/tasks/${taskId}/time-entry`}
                        className="rounded border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-100 flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Log time
                    </Link>
                    )}
                </div>
            </div>
            <form action={updateTaskAction} onSubmit={handleSubmit} className="space-y-4 text-sm"
                  suppressHydrationWarning>
                <div className="grid grid-cols-[12rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2">
                    <span className="font-semibold pt-1">Ticket Number</span>
                    <span className="pt-1">{ticket.TicketNumber ?? ''}</span>

                    <span className="font-semibold pt-1">Ticket Name</span>
                    <span className="pt-1">{ticket.ProjectName ?? ''}</span>

                    <span className="font-semibold pt-1">Ticket Description:</span>
                    <span className="pt-1">{ticket.ProjectDescription ?? ''}</span>

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
                                onChange={(event) => setSelectedStatusId(Number(event.target.value))}
                                disabled={isTaskCompletedOrCancelled}
                                className="rounded border border-gray-300 bg-white px-2 py-1 w-52 disabled:bg-gray-100"
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
                                <input type="hidden" name="statusId" value={selectedStatusValue}
                                       suppressHydrationWarning/>
                                <span className="pt-1">
                                {statusOptions.find((s) => String(s.value) === selectedStatusValue)?.label ?? '-'}
                            </span>
                            </>
                        )}
                        {displayErrors.statusId && (
                            <p className="mt-0.5 text-xs text-red-600">{displayErrors.statusId}</p>
                        )}
                    </div>

                    {isMarkingWaiting && (
                        <>
                            <label htmlFor="waitingReason" className="font-semibold pt-1">
                                Waiting Reason <span className="text-red-500">*</span>
                            </label>
                            <div>
                                <select
                                    id="waitingReason"
                                    name="waitingReason"
                                    value={waitingReason}
                                    onChange={(event) => setWaitingReason(event.target.value)}
                                    className="rounded border border-gray-300 bg-white px-2 py-1 w-72"
                                    required
                                    suppressHydrationWarning
                                >
                                    <option value="">-- Select a reason --</option>
                                    <option value="waiting-for-part">Waiting For Part</option>
                                    <option value="waiting-for-permission">Waiting For Permission to Release</option>
                                    <option value="other">Other</option>
                                </select>
                                {displayErrors.waitingReason && (
                                    <p className="mt-0.5 text-xs text-red-600">{displayErrors.waitingReason}</p>
                                )}
                            </div>

                            {waitingReason === 'other' && (
                                <>
                                    <label htmlFor="waitingNote" className="font-semibold pt-1">
                                        Additional Note <span className="text-red-500">*</span>
                                    </label>
                                    <div>
                                    <textarea
                                        id="waitingNote"
                                        name="waitingNote"
                                        rows={3}
                                        required
                                        className="rounded border border-gray-300 bg-white px-2 py-1 w-72"
                                        suppressHydrationWarning
                                    />
                                        {displayErrors.waitingNote && (
                                            <p className="mt-0.5 text-xs text-red-600">{displayErrors.waitingNote}</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {isMarkingCancelled && (
                        <>
                            <label htmlFor="cancelledNote" className="font-semibold pt-1">
                                Cancelled Note <span className="text-red-500">*</span>
                            </label>
                            <div>
                            <textarea
                                id="cancelledNote"
                                name="cancelledNote"
                                rows={3}
                                required
                                className="rounded border border-gray-300 bg-white px-2 py-1 w-72"
                                suppressHydrationWarning
                            />
                                {displayErrors.cancelledNote && (
                                    <p className="mt-0.5 text-xs text-red-600">{displayErrors.cancelledNote}</p>
                                )}
                            </div>
                        </>
                    )}

                    {isMarkingCompleted && (
                        <>
                            <label htmlFor="completedNote" className="font-semibold pt-1">
                                Completed Note
                            </label>
                            <div>
                            <textarea
                                id="completedNote"
                                name="completedNote"
                                rows={3}
                                className="rounded border border-gray-300 bg-white px-2 py-1 w-72"
                                suppressHydrationWarning
                            />
                                {displayErrors.completedNote && (
                                    <p className="mt-0.5 text-xs text-red-600">{displayErrors.completedNote}</p>
                                )}
                            </div>

                            <span className="font-semibold pt-1">Log Time</span>
                            <div className="space-y-3">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="entryDate" className="mb-1 block text-xs font-medium">
                                            Entry date
                                        </label>
                                        <input
                                            id="entryDate"
                                            name="entryDate"
                                            type="date"
                                            defaultValue={new Date().toISOString().split('T')[0]}
                                            className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                                        />
                                        {displayErrors.entryDate && <p className="mt-1 text-xs text-red-600">{displayErrors.entryDate}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="hours" className="mb-1 block text-xs font-medium">
                                            Hours
                                        </label>
                                        <input
                                            id="hours"
                                            name="hours"
                                            type="number"
                                            defaultValue={0}
                                            min="0"
                                            max="24"
                                            step="0.25"
                                            className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                                        />
                                        {displayErrors.hours && <p className="mt-1 text-xs text-red-600">{displayErrors.hours}</p>}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

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
                                disabled={isTaskCompletedOrCancelled}
                                className="rounded border border-gray-300 bg-white px-2 py-1 w-52 disabled:bg-gray-100"
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
                                <input type="hidden" name="assigneeID" value={selectedAssigneeValue}
                                       suppressHydrationWarning/>
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

                    <div className="col-span-2">
                        <button
                            type="button"
                            onClick={() => setIsNotesCollapsed(!isNotesCollapsed)}
                            className="flex items-center gap-2 font-semibold pt-1 hover:text-blue-600"
                        >
                            <span>{isNotesCollapsed ? '▶' : '▼'}</span>
                            <span>Notes</span>
                        </button>
                    </div>
                    {!isNotesCollapsed && (
                        <div className="col-span-2 space-y-2 pt-1">
                            {taskNotes.length === 0 && <p className="text-xs text-slate-500">No notes yet.</p>}
                            {taskNotes.map((note) => (
                                <div key={note.ID} className="rounded border border-slate-200 bg-slate-50 px-2 py-1">
                                    <p className="whitespace-pre-wrap text-xs">{note.TaskNote}</p>
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        {note.CreatedTimestamp
                                            ? new Date(note.CreatedTimestamp).toLocaleString('en-US')
                                            : 'Unknown timestamp'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

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
        </>
    )
}

