'use server'

import {revalidatePath} from 'next/cache'
import {createTicket as createTicketRecord} from '@/server/data/ticket'
import {checkExistingTask, createTask as createTaskRecord} from '@/server/data/task'
import type {CreateTicketFieldErrors, CreateTicketState} from '@/features/tickets/actions/ticketActionTypes'
import {parseDateValue} from '@/lib/date'
import {parseOptionalInt, parsePositiveIntOrDefault} from '@/server/data/lib/common'
import {validateAndParseTaskFields, isTaskRowEmpty, type RawTaskFields, type ParsedTaskDraft} from '@/features/tasks/actions/taskValidationHelpers'

interface ParsedCreateTicketForm {
    siteID: number
    ticketNumber: string | null
    ticketName: string
    ticketDescription: string
    departmentID: number
    primaryProjectOwnerID: number | null
    secondaryProjectOwnerID: number
    initiatorEmployeeID: number
    carbonCopyEmailList: string | null
    requiresModels: boolean
}

interface ParsedTaskDraft_RawForm {
    taskName?: string
    taskTypeID?: string
    opNumber?: string
    dueDate?: string
    scheduledDueDate?: string
    manufacturingRev?: string
    drawingNumber?: string
}

type ValidateCreateTicketResult =
    | {parsedTicket: ParsedCreateTicketForm; parsedTasks: ParsedTaskDraft[]}
    | {errorState: CreateTicketState}

const TASK_KEY_BRACKET_REGEX = /^tasks\[(\d+)]\[(\w+)]$/
const TASK_KEY_DOT_REGEX = /^tasks\.(\d+)\.(\w+)$/
const TASK_KEY_SUFFIX_REGEX = /^(taskName|taskTypeID|opNumber|dueDate|scheduledDueDate|manufacturingRev|drawingNumber)_(\d+)$/

function setFieldError(fieldErrors: CreateTicketFieldErrors, key: string, message: string): void {
    ;(fieldErrors as Record<string, string>)[key] = message
}

function parseTaskEntries(formData: FormData): Map<number, RawTaskFields> {
    const taskRows = new Map<number, RawTaskFields>()

    for (const [key, rawValue] of formData.entries()) {
        if (typeof rawValue !== 'string') {
            continue
        }

        const value = rawValue.trim()

        const bracketMatch = key.match(TASK_KEY_BRACKET_REGEX)
        if (bracketMatch) {
            const index = Number(bracketMatch[1])
            const field = bracketMatch[2] as keyof RawTaskFields
            taskRows.set(index, {...taskRows.get(index), [field]: value})
            continue
        }

        const dotMatch = key.match(TASK_KEY_DOT_REGEX)
        if (dotMatch) {
            const index = Number(dotMatch[1])
            const field = dotMatch[2] as keyof RawTaskFields
            taskRows.set(index, {...taskRows.get(index), [field]: value})
            continue
        }

        const suffixMatch = key.match(TASK_KEY_SUFFIX_REGEX)
        if (suffixMatch) {
            const field = suffixMatch[1] as keyof RawTaskFields
            const index = Number(suffixMatch[2])
            taskRows.set(index, {...taskRows.get(index), [field]: value})
        }
    }

    return taskRows
}

function validateAndParseCreateTicketForm(formData: FormData): ValidateCreateTicketResult {
    const siteIDValue = String(formData.get('siteID') ?? '').trim()
    const ticketNumberValue = String(formData.get('ticketNumber') ?? '').trim()
    const ticketNameValue = String(formData.get('ticketName') ?? '').trim()
    const ticketDescriptionValue = String(formData.get('ticketDescription') ?? '').trim()
    const departmentIDValue = String(formData.get('departmentID') ?? '').trim()
    const primaryProjectOwnerIDValue = String(formData.get('primaryProjectOwnerID') ?? '').trim()
    const secondaryProjectOwnerIDValue = String(formData.get('secondaryProjectOwnerID') ?? '').trim()
    const initiatorEmployeeIDValue = String(formData.get('initiatorEmployeeID') ?? '').trim()
    const carbonCopyEmailListValue = String(formData.get('carbonCopyEmailList') ?? '').trim()
    const requiresModelsValue = String(formData.get('requiresModels') ?? '').trim().toLowerCase()

    const fieldErrors: CreateTicketFieldErrors = {}

    const parsedSiteID = /^\d+$/.test(siteIDValue)
        ? parsePositiveIntOrDefault(siteIDValue, -1)
        : -1
    if (parsedSiteID <= 0) {
        setFieldError(fieldErrors, 'siteID', 'Site is required.')
    }

    if (!ticketNameValue) {
        setFieldError(fieldErrors, 'ticketName', 'Ticket name is required.')
    }

    const parsedDepartmentID = /^\d+$/.test(departmentIDValue)
        ? parsePositiveIntOrDefault(departmentIDValue, -1)
        : -1
    if (parsedDepartmentID <= 0) {
        setFieldError(fieldErrors, 'departmentID', 'Department is required.')
    }

    const parsedPrimaryOwnerID = primaryProjectOwnerIDValue
        ? (/^\d+$/.test(primaryProjectOwnerIDValue) ? parseOptionalInt(primaryProjectOwnerIDValue) : undefined)
        : undefined
    if (primaryProjectOwnerIDValue && (parsedPrimaryOwnerID === undefined || parsedPrimaryOwnerID <= 0)) {
        setFieldError(fieldErrors, 'primaryProjectOwnerID', 'Primary project owner is invalid.')
    }

    const parsedSecondaryOwnerID = /^\d+$/.test(secondaryProjectOwnerIDValue)
        ? parsePositiveIntOrDefault(secondaryProjectOwnerIDValue, -1)
        : -1
    if (parsedSecondaryOwnerID <= 0) {
        setFieldError(fieldErrors, 'secondaryProjectOwnerID', 'Quality engineer is required.')
    }

    const parsedInitiatorEmployeeID = /^\d+$/.test(initiatorEmployeeIDValue)
        ? parsePositiveIntOrDefault(initiatorEmployeeIDValue, -1)
        : -1
    if (parsedInitiatorEmployeeID <= 0) {
        setFieldError(fieldErrors, 'initiatorEmployeeID', 'Initiator is required.')
    }

    if (carbonCopyEmailListValue) {
        const parsedEmails = carbonCopyEmailListValue
            .split(/[;,]/)
            .map((email) => email.trim())
            .filter(Boolean)
        const hasInvalidEmail = parsedEmails.some((email) => !/^\S+@\S+\.\S+$/.test(email))
        if (hasInvalidEmail) {
            setFieldError(fieldErrors, 'carbonCopyEmailList', 'One or more CC email addresses are invalid.')
        }
    }

    const taskRows = parseTaskEntries(formData)
    const parsedTasks: ParsedTaskDraft[] = []
    const orderedRows = [...taskRows.entries()].sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)

    for (const [rowIndex, row] of orderedRows) {
        if (isTaskRowEmpty(row)) {
            continue
        }

        const errorPrefix = `tasks.${rowIndex}`
        const parsedTask = validateAndParseTaskFields(row, (key, message) => {
            setFieldError(fieldErrors, key, message)
        }, errorPrefix)

        if (parsedTask) {
            parsedTasks.push(parsedTask)
        }
    }

    if (Object.keys(fieldErrors).length > 0) {
        return {
            errorState: {
                success: false,
                fieldErrors,
            },
        }
    }

    const requiresModels = ['1', 'true', 'on', 'yes'].includes(requiresModelsValue)

    return {
        parsedTicket: {
            siteID: parsedSiteID!,
            ticketNumber: ticketNumberValue || null,
            ticketName: ticketNameValue,
            ticketDescription: ticketDescriptionValue,
            departmentID: parsedDepartmentID!,
            primaryProjectOwnerID: parsedPrimaryOwnerID && parsedPrimaryOwnerID > 0 ? parsedPrimaryOwnerID : null,
            secondaryProjectOwnerID: parsedSecondaryOwnerID!,
            initiatorEmployeeID: parsedInitiatorEmployeeID!,
            carbonCopyEmailList: carbonCopyEmailListValue || null,
            requiresModels,
        },
        parsedTasks,
    }
}

export async function createTicket(
    _prevState: CreateTicketState,
    formData: FormData,
): Promise<CreateTicketState> {
    const validationResult = validateAndParseCreateTicketForm(formData)
    if ('errorState' in validationResult) {
        return validationResult.errorState
    }

    const {parsedTicket, parsedTasks} = validationResult

    for (let index = 0; index < parsedTasks.length; index += 1) {
        const task = parsedTasks[index]
        const alreadyExists = await checkExistingTask(task.taskName, task.operation, task.taskTypeID)
        if (alreadyExists) {
            const duplicateTaskErrors: CreateTicketFieldErrors = {}
            setFieldError(duplicateTaskErrors, `tasks.${index}.taskName`, 'A task with this name, operation, and task type already exists.')
            setFieldError(duplicateTaskErrors, `tasks.${index}.opNumber`, 'A task with this name, operation, and task type already exists.')
            setFieldError(duplicateTaskErrors, `tasks.${index}.taskTypeID`, 'A task with this name, operation, and task type already exists.')

            return {
                success: false,
                fieldErrors: duplicateTaskErrors,
            }
        }
    }

    try {
        const createdTicket = await createTicketRecord({
            SiteID: parsedTicket.siteID,
            TicketNumber: parsedTicket.ticketNumber ?? '',
            ProjectName: parsedTicket.ticketName,
            ProjectDescription: parsedTicket.ticketDescription || null,
            DepartmentID: parsedTicket.departmentID,
            PrimaryProjectOwnerID: parsedTicket.primaryProjectOwnerID,
            SecondaryProjectOwnerID: parsedTicket.secondaryProjectOwnerID,
            InitiatorEmployeeID: parsedTicket.initiatorEmployeeID,
            CarbonCopyEmailList: parsedTicket.carbonCopyEmailList,
            RequiresModels: parsedTicket.requiresModels ? 1 : 0,
        })

        for (const task of parsedTasks) {
            await createTaskRecord({
                ProjectID: createdTicket.ID,
                StatusID: 1,
                TaskName: task.taskName,
                DrawingNumber: task.drawingNumber,
                DueDate: task.dueDate,
                ManufacturingRev: task.manufacturingRev,
                Operation: task.operation,
                ScheduledDueDate: task.scheduledDueDate,
                TaskTypeID: task.taskTypeID,
                CurrentlyRunning: 0,
            })
        }

        revalidatePath('/tickets')
        revalidatePath('/tasks')

        return {
            success: true,
            fieldErrors: {},
        }
    } catch {
        return {
            success: false,
            fieldErrors: {},
            formError: 'Failed to create ticket. Please try again.',
        }
    }
}
