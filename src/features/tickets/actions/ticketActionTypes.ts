
/**
 * Shared state and field-error types for ticket create/update server actions.
 */
// Field errors for Create Task
export type CreateTicketFieldErrors = Partial<Record<
    | 'siteID'
    | 'ticketName'
    | 'primaryProjectOwnerID'
    | 'manufacturingEngineerID'
    | 'departmentID'
    | 'secondaryProjectOwnerID'
    | 'qualityEngineerID'
    | 'initiatorEmployeeID'
    | 'carbonCopyEmailList'
    | 'copyUserEmailAddresses'
    | `copyUserEmailAddresses.${number}`
    | `tasks.${number}.taskName`
    | `tasks.${number}.taskTypeID`
    | `tasks.${number}.opNumber`
    | `tasks.${number}.dueDate`
    | `tasks.${number}.scheduledDueDate`
    | `tasks.${number}.manufacturingRev`,
    string
>>

export interface CreateTicketTaskFormValues {
    taskTypeID: string
    dueDate: string
    scheduledDueDate: string
    taskName: string
    manufacturingRev: string
    drawingNumber: string
    opNumber: string
}


export interface CreateTicketFormValues {
    ticketName: string
    ticketDescription: string
    departmentID: string
    qualityEngineerID: string
    manufacturingEngineerID: string
    requiresNewModels: string
    copyUserEmailAddresses: string[]
    tasks: CreateTicketTaskFormValues[]
}


export interface CreateTicketState {
    success: boolean
    fieldErrors: CreateTicketFieldErrors
    formError?: string
    values?: CreateTicketFormValues
}

export const INITIAL_CREATE_TICKET_STATE: CreateTicketState = {
    success: false,
    fieldErrors: {},
}

// Field errors for Update Ticket
export type UpdateTicketFieldErrors = Partial<Record<
    | 'ticketName'
    | 'primaryProjectOwnerID'
    | 'secondaryProjectOwnerID',
    string
>>

export interface UpdateTicketState {
    success: boolean
    fieldErrors: UpdateTicketFieldErrors
    formError?: string
}

export const INITIAL_UPDATE_TICKET_STATE: UpdateTicketState = {
    success: false,
    fieldErrors: {},
}

