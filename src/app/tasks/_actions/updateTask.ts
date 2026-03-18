'use server'

import {revalidatePath} from 'next/cache'
import {
    isActiveTaskStatus,
    TASK_STATUS_CANCELLED_ID,
    TASK_STATUS_COMPLETED_ID,
    isRevertingToNotStarted,
    shouldSetDateStartedForTransition,
    TASK_STATUS_NOT_STARTED_ID,
    TASK_STATUS_WAITING_ID,
} from '@/lib/taskStatusTransition'
import {getTaskById, updateTask as updateTaskRecord} from '@/server/data/task'
import {createTaskNote} from '@/server/data/taskNote'
import {getProjectById, getQualityEngineerByProjectID} from '@/server/data/project'
import type {UpdateTaskFieldErrors, UpdateTaskState} from '@/app/tasks/_actions/updateTaskTypes'
import {parseDateValue} from '@/lib/date'

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
}

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
        },
    }
}

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

        if (isRevertingToNotStarted(currentTask.StatusID, statusId)) {
            return {
                success: false,
                fieldErrors: {
                    statusId: 'Cannot move a Started or Waiting task back to Not Started.',
                },
            }
        }

        if (currentTask.AssignedToID && assigneeId == null) {
            return {
                success: false,
                fieldErrors: {
                    assigneeID: 'Cannot remove assignee once assigned.',
                },
            }
        }

        const isTaskCurrentlyActive = isActiveTaskStatus(currentTask.StatusID)
        const isMarkingWaiting = statusId === TASK_STATUS_WAITING_ID && currentTask.StatusID !== TASK_STATUS_WAITING_ID
        const isMarkingCancelled = isTaskCurrentlyActive && statusId === TASK_STATUS_CANCELLED_ID
        const isMarkingCompleted = isTaskCurrentlyActive && statusId === TASK_STATUS_COMPLETED_ID

        if (isMarkingWaiting && !waitingReason) {
            return {
                success: false,
                fieldErrors: {
                    waitingReason: 'Please select a waiting reason.',
                },
            }
        }

        if (isMarkingWaiting && waitingReason === 'other' && !waitingNote) {
            return {
                success: false,
                fieldErrors: {
                    waitingNote: 'Waiting note is required when selecting "Other".',
                },
            }
        }

        if (isMarkingCancelled && !cancelledNote) {
            return {
                success: false,
                fieldErrors: {
                    cancelledNote: 'Cancelled note is required when setting status to Cancelled.',
                },
            }
        }

        const shouldSetDateStarted =
            currentTask.DateStarted == null && shouldSetDateStartedForTransition(currentTask.StatusID, statusId)

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
        }

        const updatedTask = await updateTaskRecord(taskId, update)
        if (!updatedTask) {
            return {
                success: false,
                fieldErrors: {},
                formError: 'Task was not found.',
            }
        }

        if (isMarkingWaiting && waitingReason) {
            let noteText = ''
            
            if (waitingReason === 'waiting-for-part') {
                noteText = 'Waiting for part in order to complete the program.'
            } else if (waitingReason === 'waiting-for-permission') {
                // Get the project and quality engineer name for the template
                const project = await getProjectById(currentTask.ProjectID)
                if (project) {
                    const qe = await getQualityEngineerByProjectID(project.ID)
                    const qeName = qe?.FullName ?? 'Quality Engineer'
                    noteText = `Waiting for Permission to release from ${qeName}`
                }
            } else if (waitingReason === 'other') {
                noteText = waitingNote
            }
            
            if (noteText) {
                await createTaskNote({
                    TaskID: taskId,
                    TaskNote: noteText,
                })
            }
        }

        if (isMarkingCancelled && cancelledNote) {
            await createTaskNote({
                TaskID: taskId,
                TaskNote: cancelledNote,
            })
        }

        if (isMarkingCompleted && completedNote) {
            await createTaskNote({
                TaskID: taskId,
                TaskNote: completedNote,
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
