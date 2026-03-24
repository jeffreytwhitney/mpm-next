import {parseDateValue} from '@/lib/date'
import {parsePositiveIntOrDefault} from '@/server/data/lib/common'

/**
 * Represents a parsed and validated task form (single task).
 * Used by both addTaskAction (single-task form) and addTicketAction (per-row in batch form).
 */
export interface ParsedTaskDraft {
    taskName: string
    taskTypeID: number
    operation: string
    dueDate: Date
    scheduledDueDate: Date
    manufacturingRev: string
    drawingNumber: string | null
}

/**
 * Raw task field values extracted from FormData or form row.
 */
export interface RawTaskFields {
    taskName?: string
    taskTypeID?: string
    opNumber?: string
    dueDate?: string
    scheduledDueDate?: string
    manufacturingRev?: string
    drawingNumber?: string
}

/**
 * Error callback for setting field-level validation errors.
 * Allows caller to define error key strategy (flat vs namespaced).
 */
export type SetFieldErrorFn = (key: string, message: string) => void

/**
 * Validates and parses raw task fields into a normalized ParsedTaskDraft.
 * Returns validation errors keyed by the provided `errorKeyPrefix`.
 *
 * @param fields Raw task field values
 * @param setError Callback to record field errors; called with `${errorKeyPrefix}.${fieldName}`
 * @param errorKeyPrefix Prefix for error keys (e.g., '' for flat, 'tasks.0' for nested)
 * @returns Parsed task if all validations pass; `null` if any validation failed
 */
export function validateAndParseTaskFields(
    fields: RawTaskFields,
    setError: SetFieldErrorFn,
    errorKeyPrefix: string = '',
): ParsedTaskDraft | null {
    const taskName = (fields.taskName ?? '').trim()
    const taskTypeIDValue = (fields.taskTypeID ?? '').trim()
    const opNumber = (fields.opNumber ?? '').trim()
    const dueDateValue = (fields.dueDate ?? '').trim()
    const scheduledDueDateValue = (fields.scheduledDueDate ?? '').trim()
    const manufacturingRevValue = (fields.manufacturingRev ?? '').trim()
    const drawingNumberValue = (fields.drawingNumber ?? '').trim()

    const makeErrorKey = (fieldName: string) => (errorKeyPrefix ? `${errorKeyPrefix}.${fieldName}` : fieldName)

    if (!taskName) {
        setError(makeErrorKey('taskName'), 'Task name is required.')
    }

    if (!manufacturingRevValue) {
        setError(makeErrorKey('manufacturingRev'), 'Rev is required.')
    }

    if (!opNumber) {
        setError(makeErrorKey('opNumber'), 'Op number is required.')
    }

    const parsedTaskTypeID = /^\d+$/.test(taskTypeIDValue)
        ? parsePositiveIntOrDefault(taskTypeIDValue, -1)
        : -1
    if (parsedTaskTypeID <= 0) {
        setError(makeErrorKey('taskTypeID'), 'Task Type is required.')
    }

    // Check if date values are present first
    if (!dueDateValue) {
        setError(makeErrorKey('dueDate'), 'Due date is required.')
    }
    if (!scheduledDueDateValue) {
        setError(makeErrorKey('scheduledDueDate'), 'Scheduled due date is required.')
    }

    const parsedDueDate = parseDateValue(dueDateValue)
    if (dueDateValue && !parsedDueDate) {
        setError(makeErrorKey('dueDate'), 'Due date is invalid.')
    }

    const parsedScheduledDueDate = parseDateValue(scheduledDueDateValue)
    if (scheduledDueDateValue && !parsedScheduledDueDate) {
        setError(makeErrorKey('scheduledDueDate'), 'Scheduled due date is invalid.')
    }

    if (!parsedDueDate || !parsedScheduledDueDate) {
        return null
    }

    if (!taskName || !manufacturingRevValue || !opNumber || parsedTaskTypeID <= 0) {
        return null
    }

    return {
        taskName,
        taskTypeID: parsedTaskTypeID,
        operation: opNumber,
        dueDate: parsedDueDate,
        scheduledDueDate: parsedScheduledDueDate,
        manufacturingRev: manufacturingRevValue,
        drawingNumber: drawingNumberValue || null,
    }
}

/**
 * Check if a task draft is completely empty (all fields blank).
 */
export function isTaskRowEmpty(fields: RawTaskFields): boolean {
    return !(
        (fields.taskName ?? '').trim() ||
        (fields.taskTypeID ?? '').trim() ||
        (fields.opNumber ?? '').trim() ||
        (fields.dueDate ?? '').trim() ||
        (fields.scheduledDueDate ?? '').trim() ||
        (fields.manufacturingRev ?? '').trim() ||
        (fields.drawingNumber ?? '').trim()
    )
}

