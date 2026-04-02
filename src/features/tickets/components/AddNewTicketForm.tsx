'use client'

import React, {useActionState, useEffect, useMemo, useState} from 'react'
import {useRouter} from 'next/navigation'
import {createTicket} from '@/features/tickets/actions/addTicketAction'
import {getEngineerOptionsByDepartment} from '@/features/tickets/actions/getEngineerOptionsByDepartmentAction'
import type {DepartmentDropdownOption} from '@/server/data/department'
import type {CurrentUser} from '@/lib/auth/currentUserTypes'
import type {UserDropDownOption} from '@/server/data/user'
import type {TaskTypeDropdownOption} from '@/server/data/taskType'
import {USER_TYPE_IDS} from '@/lib/auth/roles'
import {
    INITIAL_CREATE_TICKET_STATE,
    type CreateTicketFieldErrors,
} from '@/features/tickets/actions/ticketActionTypes'

import {
    BUTTON_ICON_CLASS,
    BUTTON_PRIMARY_CLASS,
    BUTTON_SECONDARY_CLASS,
    ERROR_TEXT_COMPACT_CLASS,
    FORM_CLASS,
    FORM_ERROR_CLASS,
    FORM_ROW_LABEL_CLASS,
    FORM_TWO_COLUMN_GRID_CLASS,
    INPUT_SMALL_CLASS,
    REQUIRED_ASTERISK_CLASS,
    TEXTAREA_CLASS,
} from '@/components/ui/classTokens'

const NEW_TICKET_SAVED_EVENT = 'ticket-new:saved'

interface AddTicketFormProps {
    departmentOptions: DepartmentDropdownOption[]
    taskTypeOptions: TaskTypeDropdownOption[]
    currentUser: CurrentUser
    initialQualityEngineerOptions?: UserDropDownOption[]
    initialManufacturingEngineerOptions?: UserDropDownOption[]
}

type FieldErrors = CreateTicketFieldErrors

interface TaskRowDraft {
    taskName: string
    drawingNumber: string
    taskTypeID: string
    opNumber: string
    manufacturingRev: string
    dueDate: string
}

function createEmptyTaskRow(): TaskRowDraft {
    return {
        taskName: '',
        drawingNumber: '',
        taskTypeID: '',
        opNumber: '',
        manufacturingRev: '',
        dueDate: '',
    }
}

function validateForm(formData: FormData, taskRows: TaskRowDraft[]): FieldErrors {
    const errors: FieldErrors = {}
    const seenTaskKeys = new Map<string, number>()

    if (!formData.get('ticketName')?.toString().trim()) {
        errors.ticketName = 'Ticket name is required.'
    }

    if (!formData.get('departmentID')?.toString().trim()) {
        errors.departmentID = 'Department is required.'
    }

    if (!formData.get('qualityEngineerID')?.toString().trim()) {
        errors.qualityEngineerID = 'Quality engineer is required.'
    }

    const requiresModels = Boolean(formData.get('requiresNewModels'))
    if (requiresModels && !formData.get('manufacturingEngineerID')?.toString().trim()) {
        errors.manufacturingEngineerID = 'Manufacturing engineer is required when "Requires Models" is selected.'
    }

    for (let index = 0; index < taskRows.length; index += 1) {
        const taskRow = taskRows[index]
        const trimmedTaskName = taskRow.taskName.trim()
        const trimmedTaskTypeID = taskRow.taskTypeID.trim()
        const trimmedOpNumber = taskRow.opNumber.trim()
        const trimmedManufacturingRev = taskRow.manufacturingRev.trim()

        if (!trimmedTaskName) {
            ;(errors as Record<string, string>)[`tasks.${index}.taskName`] = 'Task name is required.'
        }
        if (!trimmedTaskTypeID) {
            ;(errors as Record<string, string>)[`tasks.${index}.taskTypeID`] = 'Task Type is required.'
        }
        if (!trimmedOpNumber) {
            ;(errors as Record<string, string>)[`tasks.${index}.opNumber`] = 'Op number is required.'
        }
        if (!trimmedManufacturingRev) {
            ;(errors as Record<string, string>)[`tasks.${index}.manufacturingRev`] = 'Rev is required.'
        }
        if (!taskRow.dueDate.trim()) {
            ;(errors as Record<string, string>)[`tasks.${index}.dueDate`] = 'Due date is required.'
        }

        // A duplicate is only considered when all key fields are present.
        if (trimmedTaskName && trimmedTaskTypeID && trimmedOpNumber && trimmedManufacturingRev) {
            const duplicateKey = `${trimmedTaskName.toLowerCase()}|${trimmedTaskTypeID}|${trimmedOpNumber}|${trimmedManufacturingRev}`
            const firstIndex = seenTaskKeys.get(duplicateKey)
            if (firstIndex === undefined) {
                seenTaskKeys.set(duplicateKey, index)
            } else {
                const duplicateMessage = 'Duplicate task row: Task Name, Task Type, Op, and Rev must be unique.'
                ;(errors as Record<string, string>)[`tasks.${firstIndex}.taskName`] = duplicateMessage
                ;(errors as Record<string, string>)[`tasks.${firstIndex}.taskTypeID`] = duplicateMessage
                ;(errors as Record<string, string>)[`tasks.${firstIndex}.opNumber`] = duplicateMessage
                ;(errors as Record<string, string>)[`tasks.${firstIndex}.manufacturingRev`] = duplicateMessage
                ;(errors as Record<string, string>)[`tasks.${index}.taskName`] = duplicateMessage
                ;(errors as Record<string, string>)[`tasks.${index}.taskTypeID`] = duplicateMessage
                ;(errors as Record<string, string>)[`tasks.${index}.opNumber`] = duplicateMessage
                ;(errors as Record<string, string>)[`tasks.${index}.manufacturingRev`] = duplicateMessage
            }
        }
    }

    return errors
}

export default function AddNewTicketForm({
                                             departmentOptions,
                                             taskTypeOptions,
                                             currentUser,
                                             initialQualityEngineerOptions = [],
                                             initialManufacturingEngineerOptions = [],
                                         }: AddTicketFormProps) {
    const router = useRouter()
    const [errors, setErrors] = useState<FieldErrors>({})
    const [qualityEngineerOptions, setQualityEngineerOptions] = useState<UserDropDownOption[]>(initialQualityEngineerOptions)
    const [manufacturingEngineerOptions, setManufacturingEngineerOptions] = useState<UserDropDownOption[]>(
        initialManufacturingEngineerOptions,
    )
    const [taskRows, setTaskRows] = useState<TaskRowDraft[]>([createEmptyTaskRow()])
    const [copyEmailAddresses, setCopyEmailAddresses] = useState<string[]>([])

    const isQualityEngineerUser = currentUser.userType === USER_TYPE_IDS.qualityEngineer
    const [selectedDepartmentID, setSelectedDepartmentID] = useState<string>(() => {
        if (isQualityEngineerUser && currentUser.departmentID != null) {
            return String(currentUser.departmentID)
        }
        return ''
    })

    const effectiveDepartmentID = isQualityEngineerUser
        ? (currentUser.departmentID != null ? String(currentUser.departmentID) : '')
        : selectedDepartmentID

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
        window.dispatchEvent(new CustomEvent(NEW_TICKET_SAVED_EVENT, {detail: {}}))
        router.push('/tickets/')
        router.refresh()
    }, [router, serverState.success])

    const displayErrors: FieldErrors = {
        ...serverState.fieldErrors,
        ...errors,
    }
    const taskErrorMap = displayErrors as Record<string, string | undefined>

    const formValues = serverState.values
    const [requiresModels, setRequiresModels] = useState<boolean>(formValues?.requiresNewModels === 'on')

    const selectedQualityEngineerID = useMemo(() => {
        if (isQualityEngineerUser) {
            return String(currentUser.userId)
        }
        return formValues?.qualityEngineerID ?? ''
    }, [currentUser.userId, formValues?.qualityEngineerID, isQualityEngineerUser])

    const selectedDepartmentLabel = useMemo(
        () =>
            departmentOptions.find((department) => String(department.value) === effectiveDepartmentID)?.label ??
            'Assigned department',
        [departmentOptions, effectiveDepartmentID],
    )

    useEffect(() => {
        const parsedDepartmentID = Number(effectiveDepartmentID)
        if (!Number.isInteger(parsedDepartmentID) || parsedDepartmentID <= 0) {
            return
        }

        let isCanceled = false
        const loadOptions = async () => {
            try {
                const options = await getEngineerOptionsByDepartment(parsedDepartmentID)
                if (isCanceled) {
                    return
                }
                if (!isQualityEngineerUser) {
                    setQualityEngineerOptions(options.qualityEngineerOptions)
                }
                setManufacturingEngineerOptions(options.manufacturingEngineerOptions)
            } catch {
                if (isCanceled) {
                    return
                }
                if (!isQualityEngineerUser) {
                    setQualityEngineerOptions([])
                }
                setManufacturingEngineerOptions([])
            }
        }

        void loadOptions()
        return () => {
            isCanceled = true
        }
    }, [isQualityEngineerUser, effectiveDepartmentID])

    const displayedQualityEngineerOptions = effectiveDepartmentID ? qualityEngineerOptions : []
    const displayedManufacturingEngineerOptions = effectiveDepartmentID ? manufacturingEngineerOptions : []

    const updateTaskRow = (index: number, field: keyof TaskRowDraft, value: string) => {
        setTaskRows((previousRows) =>
            previousRows.map((row, rowIndex) => (rowIndex === index ? {...row, [field]: value} : row)),
        )
    }

    const addTaskRow = () => {
        setTaskRows((previousRows) => [...previousRows, createEmptyTaskRow()])
    }

    const cloneTaskRow = (index: number) => {
        setTaskRows((previousRows) => {
            const sourceRow = previousRows[index]
            if (!sourceRow) {
                return previousRows
            }

            const clonedRows = [...previousRows]
            clonedRows.splice(index + 1, 0, {...sourceRow})
            return clonedRows
        })
    }

    const deleteTaskRow = (index: number) => {
        setTaskRows((previousRows) => {
            if (previousRows.length <= 1) {
                return previousRows
            }

            return previousRows.filter((_row, rowIndex) => rowIndex !== index)
        })
    }

    const addEmailRow = () => {
        setCopyEmailAddresses((previousRows) => [...previousRows, ''])
    }

    const deleteEmailRow = (index: number) => {
        setCopyEmailAddresses((previousRows) => {
            if (previousRows.length <= 1) {
                return previousRows
            }

            return previousRows.filter((_row, rowIndex) => rowIndex !== index)
        })
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        const formData = new FormData(e.currentTarget)
        const fieldErrors = validateForm(formData, taskRows)
        if (Object.keys(fieldErrors).length > 0) {
            e.preventDefault()
            setErrors(fieldErrors)
        } else {
            setErrors({})
        }
    }

    return (
        <form action={addTicketAction} onSubmit={handleSubmit} className={FORM_CLASS} suppressHydrationWarning>
            <div className={FORM_TWO_COLUMN_GRID_CLASS}>
                {/* Ticket Name */}
                <label htmlFor="ticketName" className={FORM_ROW_LABEL_CLASS}>
                    Ticket Name <span className={REQUIRED_ASTERISK_CLASS}>*</span>
                </label>
                <div>
                    <input
                        id="ticketName"
                        name="ticketName"
                        defaultValue={formValues?.ticketName ?? ''}
                        className={INPUT_SMALL_CLASS}
                        suppressHydrationWarning
                    />
                    {displayErrors.ticketName && (
                        <p className={ERROR_TEXT_COMPACT_CLASS}>{displayErrors.ticketName}</p>
                    )}
                </div>

                {/* Ticket Description */}
                <label htmlFor="ticketDescription" className={FORM_ROW_LABEL_CLASS}>
                    Ticket Description
                </label>
                <div>
          <textarea
              id="ticketDescription"
              name="ticketDescription"
              defaultValue={formValues?.ticketDescription ?? ''}
              className={TEXTAREA_CLASS}
              suppressHydrationWarning
          />
                </div>

                {/* Department */}
                <label htmlFor="departmentID" className={FORM_ROW_LABEL_CLASS}>
                    Department <span className={REQUIRED_ASTERISK_CLASS}>*</span>
                </label>
                <div>
                    {isQualityEngineerUser ? (
                        <>
                            <input type="hidden" name="departmentID" value={effectiveDepartmentID}/>
                            <select id="departmentID" value={effectiveDepartmentID} disabled
                                    className={INPUT_SMALL_CLASS}>
                                <option value={effectiveDepartmentID}>{selectedDepartmentLabel}</option>
                            </select>
                        </>
                    ) : (
                        <select
                            id="departmentID"
                            name="departmentID"
                            value={selectedDepartmentID}
                            onChange={(event) => setSelectedDepartmentID(event.currentTarget.value)}
                            className={INPUT_SMALL_CLASS}
                            suppressHydrationWarning
                        >
                            <option value="">-- Select a department --</option>
                            {departmentOptions.map((department) => (
                                <option key={department.value} value={String(department.value)}>
                                    {department.label}
                                </option>
                            ))}
                        </select>
                    )}
                    {displayErrors.departmentID && (
                        <p className={ERROR_TEXT_COMPACT_CLASS}>{displayErrors.departmentID}</p>
                    )}
                </div>

                {/* Quality Engineer */}
                <label htmlFor="qualityEngineerID" className={FORM_ROW_LABEL_CLASS}>
                    Quality Engineer <span className={REQUIRED_ASTERISK_CLASS}>*</span>
                </label>
                <div>
                    {isQualityEngineerUser ? (
                        <>
                            <input type="hidden" name="qualityEngineerID" value={selectedQualityEngineerID}/>
                            <select id="qualityEngineerID" value={selectedQualityEngineerID} disabled
                                    className={INPUT_SMALL_CLASS}>
                                <option value={selectedQualityEngineerID}>
                                    {currentUser.fullName ?? currentUser.displayName ?? 'Current user'}
                                </option>
                            </select>
                        </>
                    ) : (
                        <select
                            id="qualityEngineerID"
                            name="qualityEngineerID"
                            defaultValue={formValues?.qualityEngineerID ?? ''}
                            disabled={!effectiveDepartmentID}
                            className={INPUT_SMALL_CLASS}
                            suppressHydrationWarning
                        >
                            <option value="">-- Select a quality engineer --</option>
                            {displayedQualityEngineerOptions.map((qualityEngineer) => (
                                <option key={qualityEngineer.value} value={String(qualityEngineer.value)}>
                                    {qualityEngineer.label}
                                </option>
                            ))}
                        </select>
                    )}
                    {(displayErrors.qualityEngineerID || displayErrors.secondaryProjectOwnerID) && (
                        <p className={ERROR_TEXT_COMPACT_CLASS}>
                            {displayErrors.qualityEngineerID ?? displayErrors.secondaryProjectOwnerID}
                        </p>
                    )}
                </div>

                {/* Manufacturing Engineer */}
                <label htmlFor="manufacturingEngineerID" className={FORM_ROW_LABEL_CLASS}>
                    Manufacturing Engineer {requiresModels && <span className={REQUIRED_ASTERISK_CLASS}>*</span>}
                </label>
                <div>
                    <select
                        id="manufacturingEngineerID"
                        name="manufacturingEngineerID"
                        defaultValue={formValues?.manufacturingEngineerID ?? ''}
                        disabled={!effectiveDepartmentID}
                        className={INPUT_SMALL_CLASS}
                        suppressHydrationWarning
                    >
                        <option value="">-- Not assigned --</option>
                        {displayedManufacturingEngineerOptions.map((manufacturingEngineer) => (
                            <option key={manufacturingEngineer.value} value={String(manufacturingEngineer.value)}>
                                {manufacturingEngineer.label}
                            </option>
                        ))}
                    </select>
                    {(displayErrors.manufacturingEngineerID || displayErrors.primaryProjectOwnerID) && (
                        <p className={ERROR_TEXT_COMPACT_CLASS}>
                            {displayErrors.manufacturingEngineerID ?? displayErrors.primaryProjectOwnerID}
                        </p>
                    )}
                </div>

                {/* Requires New Models */}
                <label htmlFor="requiresNewModels" className={FORM_ROW_LABEL_CLASS}>
                    Requires Models
                </label>
                <div className="pt-1">
                    <input
                        type="checkbox"
                        id="requiresNewModels"
                        name="requiresNewModels"
                        checked={requiresModels}
                        onChange={(event) => setRequiresModels(event.currentTarget.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                        suppressHydrationWarning
                    />
                </div>

                <input type="hidden" name="siteID"
                       value={currentUser.siteID != null ? String(currentUser.siteID) : ''}/>
                <input type="hidden" name="initiatorEmployeeID" value={String(currentUser.userId)}/>

                {/* Copy Email Addresses */}
                <label htmlFor="copyUserEmailAddresses-0" className={FORM_ROW_LABEL_CLASS}>
                    Copy User(s) on Emails:
                </label>
                <div>
                    {copyEmailAddresses.length > 0 &&
                        copyEmailAddresses.map((email, index) => (
                            <div key={index} className="mb-2 flex items-center space-x-2">
                                <input
                                    id={`copyUserEmailAddresses-${index}`}
                                    type="text"
                                    name={`copyUserEmailAddresses[${index}]`}
                                    value={email}
                                    onChange={(event) =>
                                        setCopyEmailAddresses((prev) =>
                                            prev.map((value, i) => (i === index ? event.currentTarget.value : value)),
                                        )
                                    }
                                    className={INPUT_SMALL_CLASS}
                                />
                                {copyEmailAddresses.length > 1 && (
                                    <button
                                        type="button"
                                        className={BUTTON_ICON_CLASS}
                                        onClick={() => deleteEmailRow(index)}
                                        aria-label={`Delete email row ${index + 1}`}
                                        title="Delete email"
                                    >
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                             strokeWidth="2">
                                            <path d="M6 6l12 12"/>
                                            <path d="M18 6L6 18"/>
                                        </svg>
                                    </button>
                                )}

                            </div>
                        ))}

                </div>
                <div>
                    <button type="button" className={BUTTON_SECONDARY_CLASS} onClick={addEmailRow}>
                        Add Email Address
                    </button>
                </div>

            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 text-sm">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-2 py-2 text-left">Clone</th>
                        <th className="px-2 py-2 text-left">Part / Task Name <span
                            className={REQUIRED_ASTERISK_CLASS}>*</span></th>
                        <th className="px-2 py-2 text-left">Drawing Number</th>
                        <th className="px-2 py-2 text-left">Task Type <span className={REQUIRED_ASTERISK_CLASS}>*</span>
                        </th>
                        <th className="px-2 py-2 text-left">Op Number <span className={REQUIRED_ASTERISK_CLASS}>*</span>
                        </th>
                        <th className="px-2 py-2 text-left">Rev <span className={REQUIRED_ASTERISK_CLASS}>*</span></th>
                        <th className="px-2 py-2 text-left">Due Date <span className={REQUIRED_ASTERISK_CLASS}>*</span>
                        </th>
                        <th className="px-2 py-2 text-left">Delete</th>
                    </tr>
                    </thead>
                    <tbody>
                    {taskRows.map((taskRow, index) => (
                        <tr key={`task-row-${index}`} className="border-t border-gray-200 align-top">
                            <td className="px-2 py-2">
                                <button
                                    type="button"
                                    className={BUTTON_ICON_CLASS}
                                    onClick={() => cloneTaskRow(index)}
                                    aria-label={`Clone task row ${index + 1}`}
                                    title="Clone row"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                         strokeWidth="2">
                                        <rect x="9" y="9" width="10" height="10" rx="2"/>
                                        <rect x="5" y="5" width="10" height="10" rx="2"/>
                                    </svg>
                                </button>
                            </td>
                            <td className="px-2 py-2">
                                <input
                                    name={`tasks[${index}][taskName]`}
                                    value={taskRow.taskName}
                                    onChange={(event) => updateTaskRow(index, 'taskName', event.currentTarget.value)}
                                    className={INPUT_SMALL_CLASS}
                                />
                                {taskErrorMap[`tasks.${index}.taskName`] && (
                                    <p className={ERROR_TEXT_COMPACT_CLASS}>{taskErrorMap[`tasks.${index}.taskName`]}</p>
                                )}
                            </td>
                            <td className="px-2 py-2">
                                <input
                                    name={`tasks[${index}][drawingNumber]`}
                                    value={taskRow.drawingNumber}
                                    onChange={(event) => updateTaskRow(index, 'drawingNumber', event.currentTarget.value)}
                                    className={INPUT_SMALL_CLASS}
                                />
                            </td>
                            <td className="px-2 py-2">
                                <select
                                    name={`tasks[${index}][taskTypeID]`}
                                    value={taskRow.taskTypeID}
                                    onChange={(event) => updateTaskRow(index, 'taskTypeID', event.currentTarget.value)}
                                    className={INPUT_SMALL_CLASS}
                                >
                                    <option value=""></option>
                                    {taskTypeOptions.map((taskType) => (
                                        <option key={taskType.value} value={String(taskType.value)}>
                                            {taskType.label}
                                        </option>
                                    ))}
                                </select>
                                {taskErrorMap[`tasks.${index}.taskTypeID`] && (
                                    <p className={ERROR_TEXT_COMPACT_CLASS}>{taskErrorMap[`tasks.${index}.taskTypeID`]}</p>
                                )}
                            </td>
                            <td className="px-2 py-2">
                                <input
                                    name={`tasks[${index}][opNumber]`}
                                    value={taskRow.opNumber}
                                    onChange={(event) => updateTaskRow(index, 'opNumber', event.currentTarget.value)}
                                    className={INPUT_SMALL_CLASS}
                                />
                                {taskErrorMap[`tasks.${index}.opNumber`] && (
                                    <p className={ERROR_TEXT_COMPACT_CLASS}>{taskErrorMap[`tasks.${index}.opNumber`]}</p>
                                )}
                            </td>
                            <td className="px-2 py-2">
                                <input
                                    name={`tasks[${index}][manufacturingRev]`}
                                    value={taskRow.manufacturingRev}
                                    onChange={(event) => updateTaskRow(index, 'manufacturingRev', event.currentTarget.value)}
                                    className={INPUT_SMALL_CLASS}
                                />
                                {taskErrorMap[`tasks.${index}.manufacturingRev`] && (
                                    <p className={ERROR_TEXT_COMPACT_CLASS}>{taskErrorMap[`tasks.${index}.manufacturingRev`]}</p>
                                )}
                            </td>
                            <td className="px-2 py-2">
                                <input
                                    type="date"
                                    name={`tasks[${index}][dueDate]`}
                                    value={taskRow.dueDate}
                                    onChange={(event) => updateTaskRow(index, 'dueDate', event.currentTarget.value)}
                                    className={INPUT_SMALL_CLASS}
                                />
                                <input
                                    type="hidden"
                                    name={`tasks[${index}][scheduledDueDate]`}
                                    value={taskRow.dueDate}
                                />
                                {taskErrorMap[`tasks.${index}.dueDate`] && (
                                    <p className={ERROR_TEXT_COMPACT_CLASS}>{taskErrorMap[`tasks.${index}.dueDate`]}</p>
                                )}
                            </td>
                            <td className="px-2 py-2">
                                {taskRows.length > 1 && (
                                    <button
                                        type="button"
                                        className={BUTTON_ICON_CLASS}
                                        onClick={() => deleteTaskRow(index)}
                                        aria-label={`Delete task row ${index + 1}`}
                                        title="Delete row"
                                    >
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                             strokeWidth="2">
                                            <path d="M6 6l12 12"/>
                                            <path d="M18 6L6 18"/>
                                        </svg>
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div>
                <button type="button" className={BUTTON_SECONDARY_CLASS} onClick={addTaskRow}>
                    Add Task
                </button>
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
