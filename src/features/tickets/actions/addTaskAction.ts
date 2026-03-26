'use server'

/**
 * Creates a new task for an existing ticket.
 *
 * Responsibilities in this module:
 * - Parse and validate task-create form input.
 * - Enforce duplicate task uniqueness business rules.
 * - Persist the new task with default status metadata.
 * - Revalidate the ticket detail route after success.
 */
import {revalidatePath} from 'next/cache'
import {createTask as createTaskRecord, checkExistingTask} from '@/server/data/task'
import type {CreateTaskFieldErrors, CreateTaskState, UpdateTaskState} from '@/features/tasks/actions/taskActionTypes'
import {validateAndParseTaskFields, type RawTaskFields} from '@/features/tasks/actions/taskValidationHelpers'
import {parsePositiveIntOrDefault} from '@/server/data/lib/common'

interface ParsedCreateTaskForm {
    projectID: number
    dueDate: Date
    scheduledDueDate: Date
    taskTypeID: number
    taskName: string
    manufacturingRev: string
    drawingNumber: string | null
    operation: string
}

async function validateTaskUniqueness(
    taskName: string,
    operation: string,
    taskTypeID: number,
    projectID: number,
): Promise<CreateTaskState | null> {
    const preExistingTask = await checkExistingTask(taskName, operation, taskTypeID, projectID)
    if (!preExistingTask) {
        return null
    }

    return {
        success: false,
        fieldErrors: {
            taskName: 'There is already a task with this name, op, and task type in this ticket.',
            opNumber: 'There is already a task with this name, op, and task type in this ticket.',
            taskTypeID: 'There is already a task with this name, op, and task type in this ticket.',
        },
    }
}

function validateAndParseCreateTaskForm(formData: FormData):
    | { parsed: ParsedCreateTaskForm }
    | { errorState: UpdateTaskState } {
    const projectIDValue = String(formData.get('projectID') ?? '').trim()
    const fieldErrors: CreateTaskFieldErrors = {}

    if (!projectIDValue) {
        fieldErrors.projectId = 'Project ID is required.'
    }

    const projectID = /^\d+$/.test(projectIDValue)
        ? parsePositiveIntOrDefault(projectIDValue, -1)
        : -1
    if (projectID <= 0) {
        fieldErrors.projectId = 'Project ID is required.'
    }

    const rawTaskFields: RawTaskFields = {
        taskName: String(formData.get('taskName') ?? '').trim(),
        taskTypeID: String(formData.get('taskTypeID') ?? '').trim(),
        opNumber: String(formData.get('opNumber') ?? '').trim(),
        dueDate: String(formData.get('dueDate') ?? '').trim(),
        scheduledDueDate: String(formData.get('scheduledDueDate') ?? '').trim(),
        manufacturingRev: String(formData.get('manufacturingRev') ?? '').trim(),
        drawingNumber: String(formData.get('drawingNumber') ?? '').trim(),
    }

    const parsedTask = validateAndParseTaskFields(rawTaskFields, (key, message) => {
        ;(fieldErrors as Record<string, string>)[key] = message
    })

    if (Object.keys(fieldErrors).length > 0) {
        return {
            errorState: {
                success: false,
                fieldErrors,
            },
        }
    }

    if (!parsedTask) {
        return {
            errorState: {
                success: false,
                fieldErrors,
            },
        }
    }

    return {
        parsed: {
            projectID,
            taskTypeID: parsedTask.taskTypeID,
            dueDate: parsedTask.dueDate,
            scheduledDueDate: parsedTask.scheduledDueDate,
            taskName: parsedTask.taskName,
            manufacturingRev: parsedTask.manufacturingRev,
            drawingNumber: parsedTask.drawingNumber,
            operation: parsedTask.operation,
        },
    }
}


export async function addTask(
    formData: FormData
): Promise<CreateTaskState> {
    const validationResult = validateAndParseCreateTaskForm(formData)
    if ('errorState' in validationResult) {
        return validationResult.errorState
    }

    const {
        projectID,
        taskTypeID,
        dueDate,
        scheduledDueDate,
        taskName,
        manufacturingRev,
        drawingNumber,
        operation,
    } = validationResult.parsed

    const uniquenessError = await validateTaskUniqueness(taskName, operation, taskTypeID, projectID)
    if (uniquenessError) {
        return uniquenessError
    }

    await createTaskRecord({
        ProjectID: projectID,
        TaskTypeID: taskTypeID,
        DueDate: dueDate,
        ScheduledDueDate: scheduledDueDate,
        TaskName: taskName,
        ManufacturingRev: manufacturingRev,
        DrawingNumber: drawingNumber,
        Operation: operation,
        StatusID: 1,
        CurrentlyRunning: 0,
    })


    revalidatePath(`/tickets/${projectID}`)

    return {
        success: true,
        fieldErrors: {},
    }
}