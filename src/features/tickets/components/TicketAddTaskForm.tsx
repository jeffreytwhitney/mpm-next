'use client'

import {useActionState, useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import {addTask} from '@/features/tickets/actions/addTaskAction'
import {
    INITIAL_CREATE_TASK_STATE,
    type CreateTaskFieldErrors,
} from '@/features/tasks/actions/taskActionTypes'

import type {TaskTypeDropdownOption} from '@/server/data/taskType'
import {
    BUTTON_PRIMARY_CLASS,
    FORM_CLASS,
    FORM_ERROR_CLASS,
    FORM_ROW_LABEL_CLASS,
    FORM_ROW_VALUE_CLASS,
    FORM_TWO_COLUMN_GRID_CLASS,
    ERROR_TEXT_COMPACT_CLASS,
    INPUT_SMALL_CLASS,
    REQUIRED_ASTERISK_CLASS,
} from '@/components/ui/classTokens'

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
        <form action={addTaskAction} onSubmit={handleSubmit} className={FORM_CLASS} suppressHydrationWarning>
            <input type="hidden" name="projectID" value={String(ticketId)} />

            <div className={FORM_TWO_COLUMN_GRID_CLASS}>
                <span className={FORM_ROW_LABEL_CLASS}>Ticket Number</span>
                <span className={FORM_ROW_VALUE_CLASS}>{ticketNumber}</span>

                <span className={FORM_ROW_LABEL_CLASS}>Ticket Name</span>
                <span className={FORM_ROW_VALUE_CLASS}>{ticketName}</span>

                <span className={FORM_ROW_LABEL_CLASS}>Ticket Description</span>
                <span className={FORM_ROW_VALUE_CLASS}>{ticketDescription}</span>

                <span className={FORM_ROW_LABEL_CLASS}>Status</span>
                <span className={FORM_ROW_VALUE_CLASS}>Not Started</span>

                <label htmlFor="taskTypeID" className={FORM_ROW_LABEL_CLASS}>
                    Task Type <span className={REQUIRED_ASTERISK_CLASS}>*</span>
                </label>
                <div>
                    <select
                        key={`taskType-${taskTypeDefaultValue}`}
                        id="taskTypeID"
                        name="taskTypeID"
                        defaultValue={taskTypeDefaultValue}
                        className={INPUT_SMALL_CLASS}
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
                        <p className={ERROR_TEXT_COMPACT_CLASS}>{displayErrors.taskTypeID}</p>
                    )}
                </div>

                <label htmlFor="taskName" className={FORM_ROW_LABEL_CLASS}>
                    Task Name <span className={REQUIRED_ASTERISK_CLASS}>*</span>
                </label>
                <div>
                    <input
                        id="taskName"
                        name="taskName"
                        defaultValue={formValues?.taskName ?? ''}
                        className={INPUT_SMALL_CLASS}
                        suppressHydrationWarning
                    />
                    {displayErrors.taskName && (
                        <p className={ERROR_TEXT_COMPACT_CLASS}>{displayErrors.taskName}</p>
                    )}
                </div>

                <label htmlFor="manufacturingRev" className={FORM_ROW_LABEL_CLASS}>
                    Rev <span className={REQUIRED_ASTERISK_CLASS}>*</span>
                </label>
                <div>
                    <input
                        id="manufacturingRev"
                        name="manufacturingRev"
                        defaultValue={formValues?.manufacturingRev ?? ''}
                        className={INPUT_SMALL_CLASS}
                        suppressHydrationWarning
                    />
                    {displayErrors.manufacturingRev && (
                        <p className={ERROR_TEXT_COMPACT_CLASS}>{displayErrors.manufacturingRev}</p>
                    )}
                </div>

                <label htmlFor="drawingNumber" className={FORM_ROW_LABEL_CLASS}>Drawing Number</label>
                <input
                    id="drawingNumber"
                    name="drawingNumber"
                    defaultValue={formValues?.drawingNumber ?? ''}
                    className={INPUT_SMALL_CLASS}
                    suppressHydrationWarning
                />

                <label htmlFor="opNumber" className={FORM_ROW_LABEL_CLASS}>
                    Op Number <span className={REQUIRED_ASTERISK_CLASS}>*</span>
                </label>
                <div>
                    <input
                        id="opNumber"
                        name="opNumber"
                        defaultValue={formValues?.opNumber ?? ''}
                        className={INPUT_SMALL_CLASS}
                        suppressHydrationWarning
                    />
                    {displayErrors.opNumber && (
                        <p className={ERROR_TEXT_COMPACT_CLASS}>{displayErrors.opNumber}</p>
                    )}
                </div>

                <label htmlFor="dueDate" className={FORM_ROW_LABEL_CLASS}>
                    Due Date <span className={REQUIRED_ASTERISK_CLASS}>*</span>
                </label>
                <div>
                    <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        defaultValue={formValues?.dueDate ?? ''}
                        className={INPUT_SMALL_CLASS}
                        suppressHydrationWarning
                    />
                    {displayErrors.dueDate && (
                        <p className={ERROR_TEXT_COMPACT_CLASS}>{displayErrors.dueDate}</p>
                    )}
                </div>

                <label htmlFor="scheduledDueDate" className={FORM_ROW_LABEL_CLASS}>
                    Scheduled Due Date <span className={REQUIRED_ASTERISK_CLASS}>*</span>
                </label>
                <div>
                    <input
                        type="date"
                        id="scheduledDueDate"
                        name="scheduledDueDate"
                        defaultValue={formValues?.scheduledDueDate ?? ''}
                        className={INPUT_SMALL_CLASS}
                        suppressHydrationWarning
                    />
                    {displayErrors.scheduledDueDate && (
                        <p className={ERROR_TEXT_COMPACT_CLASS}>{displayErrors.scheduledDueDate}</p>
                    )}
                </div>
            </div>

            {serverState.formError && (
                <p className={FORM_ERROR_CLASS}>{serverState.formError}</p>
            )}

            <div>
                <button
                    type="submit"
                    disabled={isPending}
                    className={BUTTON_PRIMARY_CLASS}
                >
                    {isPending ? 'Saving...' : 'Save'}
                </button>
            </div>
        </form>
    )
}

