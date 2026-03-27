'use client'
import React, {useActionState, useEffect, useState} from 'react'
import { useRouter } from 'next/navigation'
import {createTicket} from '@/features/tickets/actions/addTicketAction'
import type {TaskTypeDropdownOption} from '@/server/data/taskType'
import {DepartmentDropdownOption} from "@/server/data/department";
import type {CurrentUser} from '@/lib/auth/currentUserTypes'
import {UserDropDownOption} from "@/server/data/user";

import {
    INITIAL_CREATE_TICKET_STATE,
    type CreateTicketFieldErrors,
} from '@/features/tickets/actions/ticketActionTypes'



const TASK_ADDED_EVENT = 'ticket-task:added'

interface AddTicketFormProps {
    taskTypeOptions: TaskTypeDropdownOption[]
    departmentOptions: DepartmentDropdownOption[]
    currentUser: CurrentUser

}


type FieldErrors = CreateTicketFieldErrors

function validateForm(formData: FormData): FieldErrors {
    const errors: FieldErrors = {}

    if (!formData.get('ticketName')?.toString().trim()) {
        errors.ticketName = 'Ticket name is required.'
    }
    if (!formData.get('departmentID')?.toString().trim()) {
        errors.departmentID = 'Department is required.'
    }

    if (!formData.get('secondaryProjectOwnerID')?.toString().trim()) {
        errors.secondaryProjectOwnerID = 'Quality Engineer is required.'
    }

    const requiresModels = formData.get('requiresModels') ? formData.get('requiresModels') : false
    if (requiresModels) {
        if (!formData.get('primaryProjectOwnerID')?.toString().trim()) {
            errors.primaryProjectOwnerID = 'Manufacturing Engineer is required when "Requries Models" is set to true.'
        }
    }

    return errors
}



export default function TicketAddTaskForm({
                                                taskTypeOptions,
                                                departmentOptions,
                                                currentUser,
                                          }: AddTicketFormProps) {
    const router = useRouter()
    const [errors, setErrors] = useState<FieldErrors>({})

    const addTicketWithState = async (_previousState: typeof INITIAL_CREATE_TICKET_STATE, formData: FormData) =>
        createTicket(formData)

    const [serverState, addTicketAction, isPending] = useActionState(
        addTicketWithState,
        INITIAL_CREATE_TICKET_STATE,
    )

    useEffect(() => {
        if (!serverState.success) {
            return
        }

        window.dispatchEvent(new CustomEvent(TASK_ADDED_EVENT, {detail: {}}))
        router.push(`/tickets/`)
        router.refresh()
    }, [router, serverState.success])

    const displayErrors: FieldErrors = {
        ...serverState.fieldErrors,
        ...errors,
    }
    const formValues = serverState.values
    const taskTypeDefaultValue = formValues?.taskTypeID ?? ''

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        const formData = new FormData(e.currentTarget)
        const fieldErrors = validateForm(formData)

        if (Object.keys(fieldErrors).length > 0) {
            e.preventDefault()
            //cause the page to refresh if the errors change.
            setErrors(fieldErrors)
        } else {
            setErrors({})
        }
    }
}