'use server'

/**
 * Creates a new ticket and optional initial tasks.
 *
 * Responsibilities in this module:
 * - Parse and validate ticket-level form fields and dynamic task rows.
 * - Enforce duplicate task uniqueness before persistence.
 * - Persist the ticket, then persist associated task drafts.
 * - Revalidate tickets/tasks routes after a successful creation.
 */
import {revalidatePath} from 'next/cache'
import {createTicket as createTicketRecord} from '@/server/data/ticket'
import {createTask as createTaskRecord} from '@/server/data/task'
import type {
    CreateTicketFieldErrors,
    CreateTicketFormValues,
    CreateTicketState,
} from '@/features/tickets/actions/ticketActionTypes'
import {parseOptionalInt, parsePositiveIntOrDefault} from '@/server/data/lib/common'
import {validateAndParseTaskFields, isTaskRowEmpty, type RawTaskFields, type ParsedTaskDraft} from '@/features/tasks/actions/taskValidationHelpers'
import {requireCurrentUser} from '@/lib/auth/currentUser'
import {USER_TYPE_IDS} from '@/lib/auth/roles'

interface ParsedCreateTicketForm {
    siteID: number
    ticketNumber: string | null
    ticketName: string
    ticketDescription: string
    departmentID: number
    primaryProjectOwnerID: number | null
    secondaryProjectOwnerID: number
    initiatorEmployeeID: number
    copyUserEmailAddresses: string[]
    requiresModels: boolean
}


type ValidateCreateTicketResult =
    | {parsedTicket: ParsedCreateTicketForm; parsedTasks: ParsedTaskDraft[]}
    | {errorState: CreateTicketState}

const TASK_KEY_BRACKET_REGEX = /^tasks\[(\d+)]\[(\w+)]$/
const TASK_KEY_DOT_REGEX = /^tasks\.(\d+)\.(\w+)$/
const TASK_KEY_SUFFIX_REGEX = /^(taskName|taskTypeID|opNumber|dueDate|scheduledDueDate|manufacturingRev|drawingNumber)_(\d+)$/
const COPY_USER_EMAIL_ADDRESSES_BRACKET_REGEX = /^copyUserEmailAddresses\[(\d+)]$/
const COPY_USER_EMAIL_ADDRESSES_DOT_REGEX = /^copyUserEmailAddresses\.(\d+)$/
const EMAIL_REGEX = /^\S+@\S+\.\S+$/

function setFieldError(fieldErrors: CreateTicketFieldErrors, key: string, message: string): void {
    ;(fieldErrors as Record<string, string>)[key] = message
}

function getTrimmedFormValue(formData: FormData, ...keys: string[]): string {
    for (const key of keys) {
        const rawValue = formData.get(key)
        if (typeof rawValue === 'string') {
            return rawValue.trim()
        }
    }

    return ''
}

function parseCopyUserEmailAddresses(formData: FormData): string[] {
    const repeatedEntries: string[] = []
    const indexedEntries = new Map<number, string>()

    for (const [key, rawValue] of formData.entries()) {
        if (typeof rawValue !== 'string') {
            continue
        }

        const value = rawValue.trim()

        if (key === 'copyUserEmailAddresses' || key === 'copyUserEmailAddresses[]') {
            repeatedEntries.push(value)
            continue
        }

        const bracketMatch = key.match(COPY_USER_EMAIL_ADDRESSES_BRACKET_REGEX)
        if (bracketMatch) {
            indexedEntries.set(Number(bracketMatch[1]), value)
            continue
        }

        const dotMatch = key.match(COPY_USER_EMAIL_ADDRESSES_DOT_REGEX)
        if (dotMatch) {
            indexedEntries.set(Number(dotMatch[1]), value)
        }
    }

    if (indexedEntries.size > 0) {
        const highestIndex = Math.max(...indexedEntries.keys())
        return Array.from({length: highestIndex + 1}, (_, index) => indexedEntries.get(index) ?? '')
    }

    if (repeatedEntries.length > 0) {
        return repeatedEntries
    }

    const legacyEmailList = getTrimmedFormValue(formData, 'carbonCopyEmailList')
    if (!legacyEmailList) {
        return []
    }

    return legacyEmailList
        .split(/[;,]/)
        .map((email) => email.trim())
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

function buildTaskFormValues(formData: FormData): CreateTicketFormValues['tasks'] {
    const taskRows = parseTaskEntries(formData)
    if (taskRows.size === 0) {
        return []
    }

    const highestIndex = Math.max(...taskRows.keys())

    return Array.from({length: highestIndex + 1}, (_, index) => {
        const row = taskRows.get(index)

        return {
            projectID: '',
            taskTypeID: (row?.taskTypeID ?? '').trim(),
            dueDate: (row?.dueDate ?? '').trim(),
            scheduledDueDate: (row?.scheduledDueDate ?? '').trim(),
            taskName: (row?.taskName ?? '').trim(),
            manufacturingRev: (row?.manufacturingRev ?? '').trim(),
            drawingNumber: (row?.drawingNumber ?? '').trim(),
            opNumber: (row?.opNumber ?? '').trim(),
        }
    })
}

function getCreateTicketFormValues(formData: FormData): CreateTicketFormValues {
    return {
        ticketName: getTrimmedFormValue(formData, 'ticketName'),
        ticketDescription: getTrimmedFormValue(formData, 'ticketDescription'),
        departmentID: getTrimmedFormValue(formData, 'departmentID'),
        qualityEngineerID: getTrimmedFormValue(formData, 'qualityEngineerID', 'secondaryProjectOwnerID'),
        manufacturingEngineerID: getTrimmedFormValue(formData, 'manufacturingEngineerID', 'primaryProjectOwnerID'),
        requiresNewModels: getTrimmedFormValue(formData, 'requiresNewModels', 'requiresModels'),
        copyUserEmailAddresses: parseCopyUserEmailAddresses(formData),
        tasks: buildTaskFormValues(formData),
    }
}

function getCreateTicketFieldKeys(formData: FormData): {manufacturingEngineerKey: string; qualityEngineerKey: string} {
    return {
        manufacturingEngineerKey: formData.has('manufacturingEngineerID') ? 'manufacturingEngineerID' : 'primaryProjectOwnerID',
        qualityEngineerKey: formData.has('qualityEngineerID') ? 'qualityEngineerID' : 'secondaryProjectOwnerID',
    }
}

function validateCopyUserEmailAddresses(
    copyUserEmailAddresses: string[],
    fieldErrors: CreateTicketFieldErrors,
): string[] {
    const parsedEmails: string[] = []
    const normalizedEmailIndexes = new Map<string, number[]>()

    for (let index = 0; index < copyUserEmailAddresses.length; index += 1) {
        const email = copyUserEmailAddresses[index]?.trim() ?? ''
        if (!email) {
            continue
        }

        if (!EMAIL_REGEX.test(email)) {
            setFieldError(fieldErrors, `copyUserEmailAddresses.${index}`, 'Email address is invalid.')
            continue
        }

        parsedEmails.push(email)

        const normalizedEmail = email.toLowerCase()
        const seenIndexes = normalizedEmailIndexes.get(normalizedEmail) ?? []
        seenIndexes.push(index)
        normalizedEmailIndexes.set(normalizedEmail, seenIndexes)
    }

    for (const duplicateIndexes of normalizedEmailIndexes.values()) {
        if (duplicateIndexes.length < 2) {
            continue
        }

        for (const index of duplicateIndexes) {
            setFieldError(fieldErrors, `copyUserEmailAddresses.${index}`, 'Email address must be unique.')
        }
    }

    return parsedEmails
}

function validateAndParseCreateTicketForm(formData: FormData, values: CreateTicketFormValues): ValidateCreateTicketResult {
    const fieldKeys = getCreateTicketFieldKeys(formData)
    const siteIDValue = getTrimmedFormValue(formData, 'siteID')
    const ticketNumberValue = getTrimmedFormValue(formData, 'ticketNumber')
    const initiatorEmployeeIDValue = getTrimmedFormValue(formData, 'initiatorEmployeeID')
    const ticketNameValue = values.ticketName
    const ticketDescriptionValue = values.ticketDescription
    const departmentIDValue = values.departmentID
    const primaryProjectOwnerIDValue = values.manufacturingEngineerID
    const secondaryProjectOwnerIDValue = values.qualityEngineerID
    const requiresModelsValue = values.requiresNewModels.toLowerCase()

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
        setFieldError(fieldErrors, fieldKeys.manufacturingEngineerKey, 'Manufacturing engineer is invalid.')
    }

    const parsedSecondaryOwnerID = /^\d+$/.test(secondaryProjectOwnerIDValue)
        ? parsePositiveIntOrDefault(secondaryProjectOwnerIDValue, -1)
        : -1
    if (parsedSecondaryOwnerID <= 0) {
        setFieldError(fieldErrors, fieldKeys.qualityEngineerKey, 'Quality engineer is required.')
    }

    const parsedInitiatorEmployeeID = /^\d+$/.test(initiatorEmployeeIDValue)
        ? parsePositiveIntOrDefault(initiatorEmployeeIDValue, -1)
        : -1
    if (parsedInitiatorEmployeeID <= 0) {
        setFieldError(fieldErrors, 'initiatorEmployeeID', 'Initiator is required.')
    }

    const parsedCopyUserEmailAddresses = validateCopyUserEmailAddresses(values.copyUserEmailAddresses, fieldErrors)

    const requiresModels = ['1', 'true', 'on', 'yes'].includes(requiresModelsValue)
    if (requiresModels && !primaryProjectOwnerIDValue) {
        setFieldError(fieldErrors, fieldKeys.manufacturingEngineerKey, 'Manufacturing engineer is required when "Requires Models" is selected.')
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
                values,
            },
        }
    }


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
            copyUserEmailAddresses: parsedCopyUserEmailAddresses,
            requiresModels,
        },
        parsedTasks,
    }
}

function validateNoDuplicateTasks(parsedTasks: ParsedTaskDraft[], values: CreateTicketFormValues): CreateTicketState | null {
    const seenTasks = new Set<string>()

    for (let index = 0; index < parsedTasks.length; index += 1) {
        const task = parsedTasks[index]
        const taskKey = `${task.taskName}|${task.operation}|${task.taskTypeID}`

        if (seenTasks.has(taskKey)) {
            const duplicateTaskErrors: CreateTicketFieldErrors = {}
            setFieldError(duplicateTaskErrors, `tasks.${index}.taskName`, 'A task with this name, operation, and task type is already being added.')
            setFieldError(duplicateTaskErrors, `tasks.${index}.opNumber`, 'A task with this name, operation, and task type is already being added.')
            setFieldError(duplicateTaskErrors, `tasks.${index}.taskTypeID`, 'A task with this name, operation, and task type is already being added.')

            return {
                success: false,
                fieldErrors: duplicateTaskErrors,
                values,
            }
        }

        seenTasks.add(taskKey)
    }

    return null
}

export async function createTicket(
    formData: FormData,
): Promise<CreateTicketState> {
    const values = getCreateTicketFormValues(formData)
    const validationResult = validateAndParseCreateTicketForm(formData, values)
    if ('errorState' in validationResult) {
        return validationResult.errorState
    }

    const {parsedTicket, parsedTasks} = validationResult

    // Server-side role enforcement: if the current user is a Quality Engineer,
    // override the submitted secondaryProjectOwnerID and departmentID with the
    // values from the session — the client cannot be trusted for these fields.
    const currentUser = await requireCurrentUser()
    if (currentUser.userType === USER_TYPE_IDS.qualityEngineer) {
        parsedTicket.secondaryProjectOwnerID = currentUser.userId
        if (currentUser.departmentID != null) {
            parsedTicket.departmentID = currentUser.departmentID
        }
    }

    const duplicateTaskError = validateNoDuplicateTasks(parsedTasks, values)
    if (duplicateTaskError) {
        return duplicateTaskError
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
            CarbonCopyEmailList: parsedTicket.copyUserEmailAddresses.length > 0
                ? parsedTicket.copyUserEmailAddresses.join(', ')
                : null,
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
