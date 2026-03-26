'use server'

/**
 * Handles task detail form submissions for updating an existing task.
 *
 * Responsibilities in this module:
 * - Validate and normalize incoming form data.
 * - Enforce task status transition and assignee rules.
 * - Persist task field updates and transition timestamps.
 * - Apply ticket-level active task count updates when tasks complete/cancel.
 * - Emit related notes/time-entry side effects for waiting/cancelled/completed flows.
 * - Revalidate task list/detail routes after a successful mutation.
 */
import {revalidatePath} from 'next/cache'
import {
    isActiveTaskStatus,
    TASK_STATUS_CANCELLED_ID,
    TASK_STATUS_COMPLETED_ID,
    isRevertingToNotStarted,
    shouldSetDateStartedForTransition,
    TASK_STATUS_NOT_STARTED_ID,
    TASK_STATUS_WAITING_ID,
} from '@/features/tasks/taskStatusTransition'
import {getTaskById, updateTask as updateTaskRecord, countActiveTasksByProjectId} from '@/server/data/task'
import {getTicketById, getQualityEngineerByTicketID, updateTicket} from '@/server/data/ticket'
import type {UpdateTaskFieldErrors, UpdateTaskState} from '@/features/tasks/actions/taskActionTypes'
import {parseDateValue} from '@/lib/date'
import { addTaskNote } from '@/features/tasks/mutations/taskNoteMutations'
import { addTaskTimeEntry } from '@/features/tasks/mutations/taskTimeMutations'

interface ParsedUpdateTaskForm {
    statusId: number
    assigneeId: number | null
    dueDate: Date
    scheduledDueDate: Date
    taskName: string
    manufacturingRev: string
    drawingNumber: string
    operation: string
    manualDueDate: 0 | 1
    waitingReason: string
    waitingNote: string
    cancelledNote: string
    completedNote: string
    entryDate: Date | null
    hours: number | null
}

type ExistingTask = NonNullable<Awaited<ReturnType<typeof getTaskById>>>

interface TaskTransitionContext {
    isMarkingWaiting: boolean
    isMarkingCancelled: boolean
    isMarkingCompleted: boolean
    shouldSetDateStarted: boolean
    shouldSetDateCompleted: boolean
}

/**
 * Validates and normalizes task detail form input before mutation logic runs.
 */
function validateAndParseUpdateTaskForm(formData: FormData):
    | { parsed: ParsedUpdateTaskForm }
    | { errorState: UpdateTaskState } {
    const statusValue = String(formData.get('statusId') ?? '').trim()
    const assigneeValue = String(formData.get('assigneeID') ?? '').trim()
    const dueDateValue = String(formData.get('dueDate') ?? '').trim()
    const scheduledDueDateValue = String(formData.get('scheduledDueDate') ?? '').trim()
    const taskNameValue = String(formData.get('taskName') ?? '').trim()
    const manufacturingRevValue = String(formData.get('manufacturingRev') ?? '').trim()
    const drawingNumberValue = String(formData.get('drawingNumber') ?? '').trim()
    const opNumberValue = String(formData.get('opNumber') ?? '').trim()
    const manualDueDateValue: 0 | 1 = formData.get('manualDueDate') === 'on' ? 1 : 0
    const waitingReasonValue = String(formData.get('waitingReason') ?? '').trim()
    const waitingNoteValue = String(formData.get('waitingNote') ?? '').trim()
    const cancelledNoteValue = String(formData.get('cancelledNote') ?? '').trim()
    const completedNoteValue = String(formData.get('completedNote') ?? '').trim()
    const entryDateValue = String(formData.get('entryDate') ?? '').trim()
    const hoursValue = String(formData.get('hours') ?? '').trim()

    const fieldErrors: UpdateTaskFieldErrors = {}

    if (!taskNameValue) {
        fieldErrors.taskName = 'Task name is required.'
    }
    if (!manufacturingRevValue) {
        fieldErrors.manufacturingRev = 'Rev is required.'
    }
    if (!statusValue) {
        fieldErrors.statusId = 'Status is required.'
    }
    if (!opNumberValue) {
        fieldErrors.opNumber = 'Op number is required.'
    }
    if (!dueDateValue) {
        fieldErrors.dueDate = 'Due date is required.'
    }
    if (!scheduledDueDateValue) {
        fieldErrors.scheduledDueDate = 'Scheduled due date is required.'
    }

    if (Object.keys(fieldErrors).length > 0) {
        return {
            errorState: {
                success: false,
                fieldErrors,
            },
        }
    }

    const parsedStatusId = Number(statusValue)
    if (!Number.isInteger(parsedStatusId)) {
        return {
            errorState: {
                success: false,
                fieldErrors: {
                    statusId: 'Status is invalid.',
                },
            },
        }
    }

    const parsedAssigneeId = assigneeValue.length > 0 ? Number(assigneeValue) : null
    if (assigneeValue.length > 0 && (!Number.isInteger(parsedAssigneeId) || (parsedAssigneeId ?? 0) <= 0)) {
        return {
            errorState: {
                success: false,
                fieldErrors: {
                    assigneeID: 'Assignee is invalid.',
                },
            },
        }
    }

    if (parsedStatusId !== TASK_STATUS_NOT_STARTED_ID && parsedAssigneeId == null) {
        return {
            errorState: {
                success: false,
                fieldErrors: {
                    assigneeID: 'Cannot have a status other than Not Started without an assignee.',
                },
            },
        }
    }

    const parsedDueDate = parseDateValue(dueDateValue)
    const parsedScheduledDueDate = parseDateValue(scheduledDueDateValue)

    if (!parsedDueDate || !parsedScheduledDueDate) {
        return {
            errorState: {
                success: false,
                fieldErrors: {
                    ...(parsedDueDate ? {} : {dueDate: 'Due date is invalid.'}),
                    ...(parsedScheduledDueDate ? {} : {scheduledDueDate: 'Scheduled due date is invalid.'}),
                },
            },
        }
    }

    return {
        parsed: {
            statusId: parsedStatusId,
            assigneeId: parsedAssigneeId,
            dueDate: parsedDueDate,
            scheduledDueDate: parsedScheduledDueDate,
            taskName: taskNameValue,
            manufacturingRev: manufacturingRevValue,
            drawingNumber: drawingNumberValue,
            operation: opNumberValue,
            manualDueDate: manualDueDateValue,
            waitingReason: waitingReasonValue,
            waitingNote: waitingNoteValue,
            cancelledNote: cancelledNoteValue,
            completedNote: completedNoteValue,
            entryDate: entryDateValue ? parseDateValue(entryDateValue) : null,
            hours: hoursValue ? Number(hoursValue) : null,
        },
    }
}

/**
 * Validates update rules that depend on current persisted task state.
 */
function validateTaskUpdateBusinessRules(
    currentTask: ExistingTask,
    parsedForm: ParsedUpdateTaskForm,
):
    | { context: TaskTransitionContext }
    | { errorState: UpdateTaskState } {
    const {
        statusId,
        assigneeId,
        waitingReason,
        waitingNote,
        cancelledNote,
    } = parsedForm

    if (isRevertingToNotStarted(currentTask.StatusID, statusId)) {
        return {
            errorState: {
                success: false,
                fieldErrors: {
                    statusId: 'Cannot move a Started or Waiting task back to Not Started.',
                },
            },
        }
    }

    if (currentTask.AssignedToID && assigneeId == null) {
        return {
            errorState: {
                success: false,
                fieldErrors: {
                    assigneeID: 'Cannot remove assignee once assigned.',
                },
            },
        }
    }

    const isTaskCurrentlyActive = isActiveTaskStatus(currentTask.StatusID)
    const isMarkingWaiting = statusId === TASK_STATUS_WAITING_ID && currentTask.StatusID !== TASK_STATUS_WAITING_ID
    const isMarkingCancelled = isTaskCurrentlyActive && statusId === TASK_STATUS_CANCELLED_ID
    const isMarkingCompleted = isTaskCurrentlyActive && statusId === TASK_STATUS_COMPLETED_ID

    if (isMarkingWaiting && !waitingReason) {
        return {
            errorState: {
                success: false,
                fieldErrors: {
                    waitingReason: 'Please select a waiting reason.',
                },
            },
        }
    }

    if (isMarkingWaiting && waitingReason === 'other' && !waitingNote) {
        return {
            errorState: {
                success: false,
                fieldErrors: {
                    waitingNote: 'Waiting note is required when selecting "Other".',
                },
            },
        }
    }

    if (isMarkingCancelled && !cancelledNote) {
        return {
            errorState: {
                success: false,
                fieldErrors: {
                    cancelledNote: 'Cancelled note is required when setting status to Cancelled.',
                },
            },
        }
    }

    return {
        context: {
            isMarkingWaiting,
            isMarkingCancelled,
            isMarkingCompleted,
            shouldSetDateStarted:
                currentTask.DateStarted == null &&
                shouldSetDateStartedForTransition(currentTask.StatusID, statusId),
            shouldSetDateCompleted:
                (isMarkingCompleted || isMarkingCancelled) && !currentTask.DateCompleted,
        },
    }
}

async function buildWaitingNoteText(
    currentTask: ExistingTask,
    waitingReason: string,
    waitingNote: string,
): Promise<string> {
    if (waitingReason === 'waiting-for-part') {
        return 'Waiting for part in order to complete the program.'
    }

    if (waitingReason === 'waiting-for-permission' && currentTask.ProjectID != null) {
        const { ticket } = await getTicketById(currentTask.ProjectID)
        const qe = await getQualityEngineerByTicketID(ticket.ID)
        const qeName = qe?.FullName ?? 'Quality Engineer'
        return `Waiting for Permission to release from ${qeName}`
    }

    if (waitingReason === 'other') {
        return waitingNote
    }

    return ''
}

/**
 * Server action used by task detail form submissions.
 *
 * Enforces transition rules, persists the task, and emits related note/time
 * side effects for waiting/cancelled/completed transitions.
 */
export async function updateTask(
    taskId: number,
    _prevState: UpdateTaskState,
    formData: FormData,
): Promise<UpdateTaskState> {
    const validationResult = validateAndParseUpdateTaskForm(formData)
    if ('errorState' in validationResult) {
        return validationResult.errorState
    }

    const {
        statusId,
        assigneeId,
        dueDate,
        scheduledDueDate,
        taskName,
        manufacturingRev,
        drawingNumber,
        operation,
        manualDueDate,
        waitingReason,
        waitingNote,
        cancelledNote,
        completedNote,
        entryDate,
        hours,
    } = validationResult.parsed

    try {
        const currentTask = await getTaskById(taskId)
        if (!currentTask) {
            return {
                success: false,
                fieldErrors: {},
                formError: 'Task was not found.',
            }
        }

        const businessValidation = validateTaskUpdateBusinessRules(currentTask, validationResult.parsed)
        if ('errorState' in businessValidation) {
            return businessValidation.errorState
        }

        const {
            isMarkingWaiting,
            isMarkingCancelled,
            isMarkingCompleted,
            shouldSetDateStarted,
            shouldSetDateCompleted,
        } = businessValidation.context

        const update: Parameters<typeof updateTaskRecord>[1] = {
            StatusID: statusId,
            AssignedToID: assigneeId,
            DueDate: dueDate,
            ScheduledDueDate: scheduledDueDate,
            TaskName: taskName,
            ManufacturingRev: manufacturingRev || null,
            DrawingNumber: drawingNumber || null,
            Operation: operation,
            ManualDueDate: manualDueDate,
            ...(shouldSetDateStarted ? {DateStarted: new Date()} : {}),
            ...(shouldSetDateCompleted ? {DateCompleted: new Date()} : {}),
        }

        const updatedTask = await updateTaskRecord(taskId, update)
        if (!updatedTask) {
            return {
                success: false,
                fieldErrors: {},
                formError: 'Task was not found.',
            }
        }
        
        // Update ticket/project active task count if status = complete or canceled
        if ((isMarkingCompleted || isMarkingCancelled) && currentTask.ProjectID != null) {
            const activeTaskCount = await countActiveTasksByProjectId(currentTask.ProjectID)
            await updateTicket(currentTask.ProjectID, {
                CountOfActiveTasks: activeTaskCount,
            })
        }

        if (isMarkingWaiting && waitingReason) {
            const noteText = await buildWaitingNoteText(currentTask, waitingReason, waitingNote)
            if (noteText) {
                await addTaskNote({
                    taskId,
                    note: noteText,
                })
            }
        }

        if (isMarkingCancelled && cancelledNote) {
            await addTaskNote({
                taskId,
                note: cancelledNote,
            })
        }

        if (isMarkingCompleted && completedNote) {
            await addTaskNote({
                taskId,
                note: completedNote,
            })
        }

        if (isMarkingCompleted && entryDate && hours && assigneeId) {
            await addTaskTimeEntry({
                taskId,
                assigneeId,
                entryDate,
                hours,
            })
        }

        revalidatePath('/tasks')
        revalidatePath(`/tasks/${taskId}`)

        return {
            success: true,
            fieldErrors: {},
        }
    } catch (error) {
        console.error('Error updating task:', error)
        return {
            success: false,
            fieldErrors: {},
            formError: 'Unable to save task right now. Please try again.',
        }
    }
}
