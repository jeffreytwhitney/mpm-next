'use server'

import {revalidatePath} from 'next/cache'
import {getCurrentUserRecord} from '@/lib/auth/currentUser'
import {canEditTicket} from '@/lib/auth/permissions'
import {getTicketRecordById, updateTicket as updateTicketRecord} from '@/server/data/ticket'
import {
    getManufacturingEngineerDropdownOptions,
    getQualityEngineerDropdownOptions,
} from '@/server/data/user'
import type {UpdateTicketFieldErrors, UpdateTicketState} from '@/features/tickets/actions/ticketActionTypes'

interface ParsedUpdateTicketForm {
    ticketName: string
    ticketDescription: string
    requiresModels: boolean
    primaryProjectOwnerID: number | null
    secondaryProjectOwnerID: number
}

function parseRequiredPositiveInt(value: string): number | null {
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return null
    }
    return parsed
}

function parseOptionalPositiveInt(value: string): number | null {
    if (!value) {
        return null
    }
    return parseRequiredPositiveInt(value)
}

function validateAndParseUpdateTicketForm(formData: FormData):
    | { parsed: ParsedUpdateTicketForm }
    | { errorState: UpdateTicketState } {
    const ticketNameValue = String(formData.get('ticketName') ?? '').trim()
    const ticketDescriptionValue = String(formData.get('ticketDescription') ?? '').trim()

    const primaryOwnerRaw = String(
        formData.get('primaryProjectOwnerID')
            ?? formData.get('manufacturingEngineerID')
            ?? '',
    ).trim()

    const secondaryOwnerRaw = String(
        formData.get('secondaryProjectOwnerID')
            ?? formData.get('qualityEngineerID')
            ?? '',
    ).trim()

    const requiresModelsValue = String(formData.get('requiresModels') ?? '').trim().toLowerCase()
    const requiresModels = ['1', 'true', 'on', 'yes'].includes(requiresModelsValue)

    const fieldErrors: UpdateTicketFieldErrors = {}

    if (!ticketNameValue) {
        fieldErrors.ticketName = 'Ticket name is required.'
    }

    const parsedSecondaryOwnerID = parseRequiredPositiveInt(secondaryOwnerRaw)
    if (parsedSecondaryOwnerID == null) {
        fieldErrors.secondaryProjectOwnerID = 'Quality engineer is required.'
    }

    const parsedPrimaryOwnerID = parseOptionalPositiveInt(primaryOwnerRaw)
    if (primaryOwnerRaw && parsedPrimaryOwnerID == null) {
        return {
            errorState: {
                success: false,
                fieldErrors: {
                    primaryProjectOwnerID: 'Manufacturing engineer is invalid.',
                },
            },
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

    return {
        parsed: {
            ticketName: ticketNameValue,
            ticketDescription: ticketDescriptionValue,
            requiresModels,
            primaryProjectOwnerID: parsedPrimaryOwnerID,
            secondaryProjectOwnerID: parsedSecondaryOwnerID!,
        },
    }
}

export async function updateTicketAction(
    ticketId: number,
    _prevState: UpdateTicketState,
    formData: FormData,
): Promise<UpdateTicketState> {
    const validationResult = validateAndParseUpdateTicketForm(formData)
    if ('errorState' in validationResult) {
        return validationResult.errorState
    }

    const {
        ticketName,
        ticketDescription,
        requiresModels,
        primaryProjectOwnerID,
        secondaryProjectOwnerID,
    } = validationResult.parsed

    try {
        const [currentUser, ticket] = await Promise.all([
            getCurrentUserRecord(),
            getTicketRecordById(ticketId),
        ])

        if (!ticket) {
            return {
                success: false,
                fieldErrors: {},
                formError: 'Ticket was not found.',
            }
        }

        if (!canEditTicket(currentUser, ticket.DepartmentID)) {
            return {
                success: false,
                fieldErrors: {},
                formError: 'You do not have permission to edit this ticket.',
            }
        }

        const ticketDepartmentID = ticket.DepartmentID
        if (!Number.isInteger(ticketDepartmentID) || ticketDepartmentID <= 0) {
            return {
                success: false,
                fieldErrors: {},
                formError: 'This ticket is missing a valid department and cannot be edited.',
            }
        }

        const [qualityEngineerOptions, manufacturingEngineerOptions] = await Promise.all([
            getQualityEngineerDropdownOptions(ticketDepartmentID),
            primaryProjectOwnerID == null
                ? Promise.resolve([])
                : getManufacturingEngineerDropdownOptions(ticketDepartmentID),
        ])

        const fieldErrors: UpdateTicketFieldErrors = {}

        if (!qualityEngineerOptions.some((option) => option.value === secondaryProjectOwnerID)) {
            fieldErrors.secondaryProjectOwnerID = 'Quality engineer must belong to this ticket department.'
        }

        if (
            primaryProjectOwnerID != null &&
            !manufacturingEngineerOptions.some((option) => option.value === primaryProjectOwnerID)
        ) {
            fieldErrors.primaryProjectOwnerID = 'Manufacturing engineer must belong to this ticket department.'
        }

        if (Object.keys(fieldErrors).length > 0) {
            return {
                success: false,
                fieldErrors,
            }
        }

        const updatedTicket = await updateTicketRecord(ticketId, {
            ProjectName: ticketName,
            ProjectDescription: ticketDescription || null,
            PrimaryProjectOwnerID: primaryProjectOwnerID,
            SecondaryProjectOwnerID: secondaryProjectOwnerID,
            RequiresModels: requiresModels ? 1 : 0,
        })

        if (!updatedTicket) {
            return {
                success: false,
                fieldErrors: {},
                formError: 'Ticket was not found.',
            }
        }

        revalidatePath('/tickets')
        revalidatePath(`/tickets/${ticketId}`)

        return {
            success: true,
            fieldErrors: {},
        }
    } catch (error) {
        console.error('Error updating ticket:', error)
        return {
            success: false,
            fieldErrors: {},
            formError: 'Unable to save ticket right now. Please try again.',
        }
    }
}

