// Field errors for Create Task
export type CreateTicketFieldErrors = Partial<Record<
    | 'siteID'
    | 'ticketName'
    | 'primaryProjectOwnerID'
    | 'departmentID'
    | 'secondaryProjectOwnerID'
    | 'initiatorEmployeeID'
    | 'carbonCopyEmailList'
    | `tasks.${number}.taskName`
    | `tasks.${number}.taskTypeID`
    | `tasks.${number}.opNumber`
    | `tasks.${number}.dueDate`
    | `tasks.${number}.scheduledDueDate`
    | `tasks.${number}.manufacturingRev`,
    string
>>

export interface CreateTicketState {
    success: boolean
    fieldErrors: CreateTicketFieldErrors
    formError?: string
}

export const INITIAL_CREATE_TICKET_STATE: CreateTicketState = {
    success: false,
    fieldErrors: {},
}

// Field errors for Update Ticket
export type UpdateTicketFieldErrors = Partial<Record<
    | 'ticketName'
    | 'departmentID'
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

