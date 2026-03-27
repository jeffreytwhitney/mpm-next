'use client'

import {useActionState, useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import {addTask} from '@/features/tickets/actions/addTaskAction'
import {
    INITIAL_CREATE_TASK_STATE,
    type CreateTaskFieldErrors,
} from '@/features/tasks/actions/taskActionTypes'

import type {TaskTypeDropdownOption} from '@/server/data/taskType'

const TASK_ADDED_EVENT = 'ticket-task:added'

interface TicketAddTaskFormProps {
    ticketId: number
    ticketNumber: string
    ticketName: string
    ticketDescription: string
    taskTypeOptions: TaskTypeDropdownOption[]
}

type FieldErrors = CreateTaskFieldErrors

function validateForm(formData: FormData): FieldErrors {
    const errors: FieldErrors = {}

    if (!formData.get('taskName')?.toString().trim()) {
        errors.taskName = 'Task name is required.'
    }
    if (!formData.get('taskTypeID')?.toString().trim()) {
        errors.taskTypeID = 'Task Type is required.'
    }

    if (!formData.get('manufacturingRev')?.toString().trim()) {
        errors.manufacturingRev = 'Rev is required.'
    }
    if (!formData.get('opNumber')?.toString().trim()) {
        errors.opNumber = 'Op number is required.'
    }
    if (!formData.get('dueDate')?.toString().trim()) {
        errors.dueDate = 'Due date is required.'
    }
    if (!formData.get('scheduledDueDate')?.toString().trim()) {
        errors.scheduledDueDate = 'Scheduled due date is required.'
    }

    return errors
}

export default function TicketAddTaskForm({
    ticketId,
    ticketNumber,
    ticketName,
    ticketDescription,
    taskTypeOptions,
}: TicketAddTaskFormProps) {
    const router = useRouter()
    const [errors, setErrors] = useState<FieldErrors>({})

    const addTaskWithState = async (_previousState: typeof INITIAL_CREATE_TASK_STATE, formData: FormData) =>
        addTask(formData)

    const [serverState, addTaskAction, isPending] = useActionState(
        addTaskWithState,
        INITIAL_CREATE_TASK_STATE,
    )

    useEffect(() => {
        if (!serverState.success) {
            return
        }

        window.dispatchEvent(new CustomEvent(TASK_ADDED_EVENT, {detail: {ticketId}}))
        router.push(`/tickets/${ticketId}`)
        router.refresh()
    }, [router, serverState.success, ticketId])

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

    return (
        <form action={addTaskAction} onSubmit={handleSubmit} className="space-y-4 text-sm" suppressHydrationWarning>
            <input type="hidden" name="projectID" value={String(ticketId)} />

            <div className="grid grid-cols-[12rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2">
                <span className="font-semibold pt-1">Ticket Number</span>
                <span className="pt-1">{ticketNumber}</span>

                <span className="font-semibold pt-1">Ticket Name</span>
                <span className="pt-1">{ticketName}</span>

                <span className="font-semibold pt-1">Ticket Description</span>
                <span className="pt-1">{ticketDescription}</span>

                <span className="font-semibold pt-1">Status</span>
                <span className="pt-1">Not Started</span>

                <label htmlFor="taskTypeID" className="font-semibold pt-1">
                    Task Type <span className="text-red-500">*</span>
                </label>
                <div>
                    <select
                        key={`taskType-${taskTypeDefaultValue}`}
                        id="taskTypeID"
                        name="taskTypeID"
                        defaultValue={taskTypeDefaultValue}
                        className="rounded border border-gray-300 bg-white px-2 py-1 w-52"
                        suppressHydrationWarning
                    >
                        <option value="">-- Select a task type --</option>
                        {taskTypeOptions.map((taskType) => (
                            <option key={taskType.value} value={String(taskType.value)}>
                                {taskType.label}
                            </option>
                        ))}
                    </select>
                    {displayErrors.taskTypeID && (
                        <p className="mt-0.5 text-xs text-red-600">{displayErrors.taskTypeID}</p>
                    )}
                </div>

                <label htmlFor="taskName" className="font-semibold pt-1">
                    Task Name <span className="text-red-500">*</span>
                </label>
                <div>
                    <input
                        id="taskName"
                        name="taskName"
                        defaultValue={formValues?.taskName ?? ''}
                        className="rounded border border-gray-300 bg-white px-2 py-1 w-52"
                        suppressHydrationWarning
                    />
                    {displayErrors.taskName && (
                        <p className="mt-0.5 text-xs text-red-600">{displayErrors.taskName}</p>
                    )}
                </div>

                <label htmlFor="manufacturingRev" className="font-semibold pt-1">
                    Rev <span className="text-red-500">*</span>
                </label>
                <div>
                    <input
                        id="manufacturingRev"
                        name="manufacturingRev"
                        defaultValue={formValues?.manufacturingRev ?? ''}
                        className="rounded border border-gray-300 bg-white px-2 py-1 w-52"
                        suppressHydrationWarning
                    />
                    {displayErrors.manufacturingRev && (
                        <p className="mt-0.5 text-xs text-red-600">{displayErrors.manufacturingRev}</p>
                    )}
                </div>

                <label htmlFor="drawingNumber" className="font-semibold pt-1">Drawing Number</label>
                <input
                    id="drawingNumber"
                    name="drawingNumber"
                    defaultValue={formValues?.drawingNumber ?? ''}
                    className="rounded border border-gray-300 bg-white px-2 py-1 w-52"
                    suppressHydrationWarning
                />

                <label htmlFor="opNumber" className="font-semibold pt-1">
                    Op Number <span className="text-red-500">*</span>
                </label>
                <div>
                    <input
                        id="opNumber"
                        name="opNumber"
                        defaultValue={formValues?.opNumber ?? ''}
                        className="rounded border border-gray-300 bg-white px-2 py-1 w-52"
                        suppressHydrationWarning
                    />
                    {displayErrors.opNumber && (
                        <p className="mt-0.5 text-xs text-red-600">{displayErrors.opNumber}</p>
                    )}
                </div>

                <label htmlFor="dueDate" className="font-semibold pt-1">
                    Due Date <span className="text-red-500">*</span>
                </label>
                <div>
                    <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        defaultValue={formValues?.dueDate ?? ''}
                        className="rounded border border-gray-300 bg-white px-2 py-1 w-52"
                        suppressHydrationWarning
                    />
                    {displayErrors.dueDate && (
                        <p className="mt-0.5 text-xs text-red-600">{displayErrors.dueDate}</p>
                    )}
                </div>

                <label htmlFor="scheduledDueDate" className="font-semibold pt-1">
                    Scheduled Due Date <span className="text-red-500">*</span>
                </label>
                <div>
                    <input
                        type="date"
                        id="scheduledDueDate"
                        name="scheduledDueDate"
                        defaultValue={formValues?.scheduledDueDate ?? ''}
                        className="rounded border border-gray-300 bg-white px-2 py-1 w-52"
                        suppressHydrationWarning
                    />
                    {displayErrors.scheduledDueDate && (
                        <p className="mt-0.5 text-xs text-red-600">{displayErrors.scheduledDueDate}</p>
                    )}
                </div>
            </div>

            {serverState.formError && (
                <p className="text-sm text-red-600">{serverState.formError}</p>
            )}

            <div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                    {isPending ? 'Saving...' : 'Save'}
                </button>
            </div>
        </form>
    )
}

