'use client'

/**
 * TicketDetailForm Component
 *
 * Interactive editor for viewing and modifying ticket details, including:
 * - Core ticket information (name, description, assigned engineers)
 * - Associated task management (view, add, bulk edit)
 * - Client and server-side validation
 * - Permission-based field access control
 *
 * This component handles the presentation and submission logic while delegating
 * data persistence to the `updateTicketAction` server action. Permission and
 * authorization decisions are determined upstream in `TicketDetailContent`.
 *
 * The component integrates with Next.js App Router's useActionState hook for
 * form submission and state management, providing real-time validation feedback
 * and server error handling.
 *
 * @see {@link TicketDetailContent} - Parent component handling data fetching and permissions
 * @see {@link updateTicketAction} - Server action for persisting ticket updates
 */
import React, {useActionState} from 'react'
import { useRouter } from 'next/navigation'
import {updateTicketAction} from '@/features/tickets/actions/updateTicketAction'
import {
    INITIAL_UPDATE_TICKET_STATE,
    type UpdateTicketFieldErrors,
} from '@/features/tickets/actions/ticketActionTypes'
import type {TicketDetailModel} from '@/server/data/ticketDetail'
import type {UserDropDownOption} from '@/server/data/user'
import type {TaskStatusDropdownOption} from '@/server/data/taskStatus'
import type {TaskTypeDropdownOption} from '@/server/data/taskType'
import {filterTicketTasks, filterTicketTasksByCompletionView} from '@/features/tickets/taskFilters'
import {DataTable} from '@/components/DataTable'
import DebouncedInput from '@/components/DebouncedInput'
import {ticketDetailTaskColumns} from '@/components/columnDefs/TicketDetailTaskList'
import {AssignedToFilter, StatusFilter, TaskTypeFilter} from '@/features/tasks/components/TaskListFilterControls'
import {FILTER_RESET_TITLE, TEXT_FILTER_CLASS} from '@/lib/filterConstants'
import {
    BUTTON_PRIMARY_CLASS,
    BUTTON_SECONDARY_CLASS,
    INPUT_CLASS,
    TEXTAREA_CLASS,
    ERROR_TEXT_CLASS,
    FORM_ERROR_CLASS,
} from '@/components/ui/classTokens'

/**
 * Custom DOM event emitted after successful ticket save.
 *
 * Allows modal shells and parent containers to react to successful form submissions
 * by closing themselves or updating their state without blocking the form component.
 * The event carries the ticketId in its detail payload.
 *
 * @event ticket-detail:saved
 * @example
 * window.addEventListener('ticket-detail:saved', (e) => {
 *   console.log('Ticket saved:', e.detail.ticketId)
 *   closeModal()
 * })
 */
const TICKET_DETAIL_SAVED_EVENT = 'ticket-detail:saved'

/**
 * Props for the TicketDetailForm component.
 *
 * Controls both the data rendered and the user's ability to edit that data.
 * All editing capabilities are gated through the `canSubmit` flag, which should
 * be determined based on user permissions and ticket state upstream.
 *
 * @property {number} ticketId - The unique identifier of the ticket being edited.
 *   Used for server action binding and navigation.
 *
 * @property {TicketDetailModel} ticketDetail - Complete ticket data including:
 *   - ticket: Core ticket properties (number, name, description, owners, etc.)
 *   - tasks: Array of associated tasks with their status and assignments
 *   - departmentName: Display name of the ticket's department
 *   - submitterName: Display name of the user who created the ticket
 *
 * @property {UserDropDownOption[]} qualityEngineerOptions - List of users available
 *   for assignment as the Secondary Project Owner (quality engineer). Should be
 *   pre-filtered by department and/or role.
 *
 * @property {UserDropDownOption[]} manufacturingEngineerOptions - List of users available
 *   for assignment as the Primary Project Owner (manufacturing engineer). Should be
 *   pre-filtered by department and/or role.
 *
 * @property {boolean} canSubmit - Determines if the form fields are editable and
 *   if the submit button is shown. Should be false for view-only access or when
 *   the ticket is in a state that prevents modifications (e.g., archived).
 *
 * @example
 * <TicketDetailForm
 *   ticketId={123}
 *   ticketDetail={ticketData}
 *   qualityEngineerOptions={engineers}
 *   manufacturingEngineerOptions={manufacturers}
 *   canSubmit={userHasEditPermission}
 * />
 */
interface TicketDetailFormProps {
    ticketId: number
    ticketDetail: TicketDetailModel
    qualityEngineerOptions: UserDropDownOption[]
    manufacturingEngineerOptions: UserDropDownOption[]
    taskStatusOptions: TaskStatusDropdownOption[]
    taskTypeOptions: TaskTypeDropdownOption[]
    taskAssigneeOptions: UserDropDownOption[]
    canSubmit: boolean
}

type FieldErrors = UpdateTicketFieldErrors

/**
 * Client-side form validation for ticket details.
 *
 * Performs lightweight synchronous validation to provide immediate feedback to the user
 * before submitting the form to the server. Validation runs on form submission to prevent
 * server calls with obviously invalid data.
 *
 * **Validation Rules:**
 * - `ticketName`: Must not be empty (after trimming whitespace)
 * - `secondaryProjectOwnerID`: Must not be empty (Quality Engineer is required)
 *
 * **Note:** This validation is complementary to server-side validation. Additional
 * business logic validation (e.g., status transitions, workflow constraints) occurs
 * on the server via `updateTicketAction`.
 *
 * @param {FormData} formData - The form data to validate, typically extracted from
 *   a form submission event.
 *
 * @returns {FieldErrors} An object mapping field names to error messages. If no
 *   errors exist, the object will be empty. The presence of errors should prevent
 *   form submission.
 *
 * @example
 * const handleSubmit = (e) => {
 *   const formData = new FormData(e.currentTarget)
 *   const errors = validateForm(formData)
 *   if (Object.keys(errors).length > 0) {
 *     e.preventDefault()
 *     setErrors(errors)
 *   }
 * }
 *
 * @see {UpdateTicketFieldErrors} - Type definition for field error objects
 */
function validateForm(formData: FormData): FieldErrors {
    const errors: FieldErrors = {}

    if (!formData.get('ticketName')?.toString().trim()) {
        errors.ticketName = 'Ticket name is required.'
    }

    if (!formData.get('secondaryProjectOwnerID')?.toString().trim()) {
        errors.secondaryProjectOwnerID = 'Quality engineer is required.'
    }

    return errors
}

/**
 * Interactive ticket detail editor.
 *
 * **State Management:**
 * - Client state: `errors` (field-level validation errors), `showCompletedTasksOnly` (task visibility toggle)
 * - Server state: `serverState` from `updateTicketAction`, contains field errors and form-level errors
 * - Submission state: `isPending` indicates ongoing server action
 *
 * **Lifecycle:**
 * - On component mount, initializes empty validation errors and hides completed tasks
 * - On successful save (detected via serverState.success), dispatches TICKET_DETAIL_SAVED_EVENT
 * - Error validation runs on form submission before server action
 *
 * **Form Sections:**
 * 1. Task Management Buttons: Quick access to add single task or group edit tasks
 * 2. Ticket Information: Core editable fields (name, description, assigned engineers)
 * 3. Associated Tasks: Filtered table view with optional completed task visibility
 * 4. Form Actions: Submit button and error display (only visible when canSubmit=true)
 *
 * **Key Behaviors:**
 * - Fields disabled, task action buttons disabled, and submit button hidden when `canSubmit=false` (read-only mode)
 * - Task filtering hides Completed (StatusID=4) and Canceled (StatusID=5) by default
 * - Client validation prevents server calls with empty required fields
 * - Server errors merged with client errors for comprehensive error display
 * - Custom event system allows parent components (e.g., modals) to react to saves
 *
 * Server data and permission decisions are resolved upstream in
 * `TicketDetailContent`; this component focuses on interaction,
 * validation, and submission state.
 *
 * @see {@link TICKET_DETAIL_SAVED_EVENT} - Event emitted on successful save
 * @see {@link validateForm} - Client-side validation function
 */
export function TicketDetailForm({
    ticketId,
    ticketDetail,
    qualityEngineerOptions,
    manufacturingEngineerOptions,
    taskStatusOptions,
    taskTypeOptions,
    taskAssigneeOptions,
    canSubmit,
}: TicketDetailFormProps) {
    const {ticket, tasks, departmentName, submitterName} = ticketDetail
    
    /**
     * Client-side validation errors for individual form fields.
     * Set on form submission if validation fails, preventing server action.
     */
    const [errors, setErrors] = React.useState<FieldErrors>({})
    
    /**
     * Toggles between active tasks and completed/canceled tasks only.
     * Defaults to false so active work remains the primary view.
     */
    const [showCompletedTasksOnly, setShowCompletedTasksOnly] = React.useState<boolean>(false)
    const [partNameFilter, setPartNameFilter] = React.useState('')
    const [taskTypeID, setTaskTypeID] = React.useState<number | undefined>(undefined)
    const [assignedToID, setAssignedToID] = React.useState<number | undefined>(undefined)
    const [statusID, setStatusID] = React.useState<number | undefined>(undefined)
    
    const router = useRouter()
    
    /**
     * Server action state from updateTicketAction.
     * - serverState.success: True if save was successful
     * - serverState.fieldErrors: Server-side validation errors
     * - serverState.formError: General form-level error message
     * isPending: True while request is in flight
     */
    const [serverState, updateTicket, isPending] = useActionState(
        updateTicketAction.bind(null, ticketId),
        INITIAL_UPDATE_TICKET_STATE,
    )

    /**
     * Lifecycle effect: Dispatch success event when ticket is saved.
     * This allows parent components (e.g., modals) to react to successful saves
     * without waiting for the component to handle dismissal logic.
     */
    React.useEffect(() => {
        if (!serverState.success) {
            return
        }
        window.dispatchEvent(new CustomEvent(TICKET_DETAIL_SAVED_EVENT, {detail: {ticketId}}))
    }, [serverState.success, ticketId])

    /**
     * Merge server-side and client-side validation errors.
     * Client-side errors are cleared on successful submission.
     * Server-side errors persist across renders until user makes changes.
     */
    const displayErrors: FieldErrors = {
        ...serverState.fieldErrors,
        ...errors,
    }

    /**
     * Handle form submission with client-side validation.
     * Validates required fields before allowing the server action to execute.
     * If validation fails, prevents form submission and displays field-level errors.
     */
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        const formData = new FormData(e.currentTarget)
        const fieldErrors = validateForm(formData)

        if (Object.keys(fieldErrors).length > 0) {
            e.preventDefault()
            setErrors(fieldErrors)
        } else {
            setErrors({})
        }
    }

    /**
     * Filter tasks to show active items by default.
     * Status ID mapping:
     * - 4: Completed
     * - 5: Canceled
     * Users can toggle into a completed/canceled-only view when needed.
     */
    const filteredTasks = filterTicketTasksByCompletionView(tasks, showCompletedTasksOnly)
    const tableTasks = filterTicketTasks(filteredTasks, {
        partName: partNameFilter,
        taskTypeID,
        assignedToID,
        statusID,
    })

    const handleTaskTypeSelectChange = (value: string) => {
        if (!value) {
            setTaskTypeID(undefined)
            return
        }

        const parsedValue = Number(value)
        setTaskTypeID(Number.isNaN(parsedValue) ? undefined : parsedValue)
    }

    const handleAssignedToSelectChange = (value: string) => {
        if (!value || value === 'unAssigned') {
            setAssignedToID(undefined)
            return
        }

        const parsedValue = Number(value)
        setAssignedToID(Number.isNaN(parsedValue) ? undefined : parsedValue)
    }

    const handleStatusSelectChange = (value: string) => {
        if (!value || value === 'activeNotWaiting') {
            setStatusID(undefined)
            return
        }

        const parsedValue = Number(value)
        setStatusID(Number.isNaN(parsedValue) ? undefined : parsedValue)
    }

    const renderHeaderFilter = (columnId: string) => {
        switch (columnId) {
            case 'TaskName':
                return (
                    <DebouncedInput
                        type="text"
                        placeholder="Filter..."
                        value={partNameFilter}
                        onChange={(value) => setPartNameFilter((value ?? '').toString())}
                        className={TEXT_FILTER_CLASS}
                        debounce={300}
                        title={FILTER_RESET_TITLE}
                        onDoubleClick={() => setPartNameFilter('')}
                    />
                )
            case 'TaskType':
                return (
                    <TaskTypeFilter
                        taskTypeID={taskTypeID}
                        options={taskTypeOptions}
                        onChange={handleTaskTypeSelectChange}
                        onReset={() => setTaskTypeID(undefined)}
                    />
                )
            case 'AssignedToName':
                return (
                    <AssignedToFilter
                        assignedToID={assignedToID}
                        unassignedPreset={undefined}
                        options={taskAssigneeOptions}
                        onChange={handleAssignedToSelectChange}
                        onReset={() => setAssignedToID(undefined)}
                        emptyLabel="All"
                        includeUnassignedPreset={false}
                    />
                )
            case 'Status':
                return (
                    <StatusFilter
                        statusID={statusID}
                        statusPreset={undefined}
                        options={taskStatusOptions}
                        onChange={handleStatusSelectChange}
                        onReset={() => setStatusID(undefined)}
                        emptyLabel="All"
                        includeActiveNotWaitingPreset={false}
                    />
                )
            default:
                return null
        }
    }


    return (
        <>
            <div className="-mt-4 mb-4">
                <div className="flex flex-wrap justify-end gap-2">
                    <button
                        type="button"
                        disabled={!canSubmit}
                        onClick={() => router.push(`/tickets/${ticketId}/tasks/new`)}
                        className={`${BUTTON_SECONDARY_CLASS} text-xs flex items-center gap-1`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Task
                    </button>
                    <button
                        type="button"
                        disabled={!canSubmit}
                        onClick={() => router.push(`/tickets/${ticketId}/tasks/group-edit`)}
                        className={`${BUTTON_SECONDARY_CLASS} text-xs flex items-center gap-1`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Group Edit
                    </button>
                </div>
            </div>

            <form action={updateTicket} onSubmit={handleSubmit} className="space-y-6 text-sm" suppressHydrationWarning>
                {/* 
                 * Ticket Information Section
                 * 
                 * Displays and allows editing of core ticket properties:
                 * - Ticket Number: Read-only identifier
                 * - Ticket Name: Required, editable text field
                 * - Description: Optional, multi-line text area
                 * - Department: Read-only display of assigned department
                 * - Project Owners: Two dropdown selectors for engineers
                 * - Requires Models: Checkbox toggle
                 * - Context Info: Submitter and creation timestamp (read-only)
                 * 
                 * All input elements are disabled when canSubmit=false (read-only mode).
                 * Required fields display a red asterisk.
                 */}
                <div className="border-b pb-4">
                    <h3 className="font-semibold mb-3">Ticket Information</h3>
                    <div className="grid grid-cols-[12rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2">
                        <span className="font-medium pt-1">Ticket Number</span>
                        <span className="pt-1">{ticket.TicketNumber ?? ''}</span>

                        {/* 
                         * Ticket Name Field
                         * Required field - client validation prevents empty submission.
                         * Display-only when canSubmit=false.
                         */}
                        <label htmlFor="ticketName" className="font-medium pt-1">
                            Ticket Name {canSubmit && <span className="text-red-500">*</span>}
                        </label>
                        <div>
                            <input
                                id="ticketName"
                                name="ticketName"
                                defaultValue={ticket.ProjectName ?? ''}
                                disabled={!canSubmit}
                                className={`${INPUT_CLASS} max-w-lg disabled:bg-gray-100`}
                                suppressHydrationWarning
                            />
                            {displayErrors.ticketName && (
                                <p className={`mt-0.5 ${ERROR_TEXT_CLASS}`}>{displayErrors.ticketName}</p>
                            )}
                        </div>

                        {/* 
                         * Ticket Description Field
                         * Optional field. Display-only when canSubmit=false.
                         */}
                        <label htmlFor="ticketDescription" className="font-medium pt-1">
                            Description
                        </label>
                        <div>
                            <textarea
                                id="ticketDescription"
                                name="ticketDescription"
                                defaultValue={ticket.ProjectDescription ?? ''}
                                disabled={!canSubmit}
                                rows={3}
                                className={`${TEXTAREA_CLASS} max-w-lg disabled:bg-gray-100`}
                                suppressHydrationWarning
                            />
                        </div>

                        {/* Department - Read-only context */}
                        <span className="font-medium pt-1">Department</span>
                        <span className="pt-1">{departmentName ?? '-'}</span>

                        {/* 
                         * Manufacturing Engineer (Primary Owner)
                         * Optional assignment. Dropdown populated with filtered users.
                         */}
                        <label htmlFor="primaryProjectOwnerID" className="font-medium pt-1">
                            Manufacturing Engineer
                        </label>
                        <div>
                            <select
                                id="primaryProjectOwnerID"
                                name="primaryProjectOwnerID"
                                defaultValue={ticket.PrimaryProjectOwnerID ?? ''}
                                disabled={!canSubmit}
                                className={`${INPUT_CLASS} max-w-lg disabled:bg-gray-100`}
                                suppressHydrationWarning
                            >
                                <option value="">-- Not assigned --</option>
                                {manufacturingEngineerOptions.map((user) => (
                                    <option key={user.value} value={user.value}>
                                        {user.label}
                                    </option>
                                ))}
                            </select>
                            {displayErrors.primaryProjectOwnerID && (
                                <p className={`mt-0.5 ${ERROR_TEXT_CLASS}`}>{displayErrors.primaryProjectOwnerID}</p>
                            )}
                        </div>

                        {/* 
                         * Quality Engineer (Secondary Owner)
                         * Required field - client validation prevents empty submission.
                         * Dropdown populated with filtered users.
                         */}
                        <label htmlFor="secondaryProjectOwnerID" className="font-medium pt-1">
                            Quality Engineer {canSubmit && <span className="text-red-500">*</span>}
                        </label>
                        <div>
                            <select
                                id="secondaryProjectOwnerID"
                                name="secondaryProjectOwnerID"
                                defaultValue={ticket.SecondaryProjectOwnerID ?? ''}
                                disabled={!canSubmit}
                                className={`${INPUT_CLASS} max-w-lg disabled:bg-gray-100`}
                                suppressHydrationWarning
                            >
                                <option value="">-- Select a quality engineer --</option>
                                {qualityEngineerOptions.map((user) => (
                                    <option key={user.value} value={user.value}>
                                        {user.label}
                                    </option>
                                ))}
                            </select>
                            {displayErrors.secondaryProjectOwnerID && (
                                <p className={`mt-0.5 ${ERROR_TEXT_CLASS}`}>{displayErrors.secondaryProjectOwnerID}</p>
                            )}
                        </div>

                        {/* 
                         * Requires Models Checkbox
                         * Boolean field indicating whether this ticket requires 3D models or similar assets.
                         */}
                        <label htmlFor="requiresModels" className="font-medium pt-1">
                            Requires Models
                        </label>
                        <div className="pt-1">
                            <input
                                type="checkbox"
                                id="requiresModels"
                                name="requiresModels"
                                defaultChecked={(ticket.RequiresModels ?? 0) === 1}
                                disabled={!canSubmit}
                                className="h-4 w-4 rounded border-gray-300 disabled:opacity-50"
                                suppressHydrationWarning
                            />
                        </div>

                        {/* Audit Context Info - Read-only */}
                        <span className="font-medium pt-1">Initiator</span>
                        <span className="pt-1">{submitterName ?? '-'}</span>

                        <span className="font-medium pt-1">Created</span>
                        <span className="pt-1">
                            {ticket.CreatedTimestamp
                                ? new Date(ticket.CreatedTimestamp).toLocaleString('en-US')
                                : '-'}
                        </span>
                    </div>
                </div>

                {/* 
                 * Associated Tasks Section
                 * 
                 * Displays all tasks linked to this ticket in a table format.
                 * 
                 * Features:
                 * - Task count in heading (reflects current filter)
                 * - Visibility toggle between active tasks and completed/canceled tasks only
                 * - Clickable task names navigate to detail view
                 * - Empty state message when no tasks match the filter
                 * 
                 * Default filtering hides:
                 * - Completed (StatusID=4)
                 * - Canceled (StatusID=5)
                 * 
                 * Users can switch to a completed/canceled-only view via checkbox.
                 */}
                <div className="border-b pb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">Tasks ({tableTasks.length})</h3>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showCompletedTasksOnly}
                                    onChange={(e) => setShowCompletedTasksOnly(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <span>Show Completed</span>
                            </label>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <DataTable
                            columns={ticketDetailTaskColumns}
                            data={tableTasks}
                            renderHeaderFilter={renderHeaderFilter}
                        />
                    </div>
                </div>

                {/* 
                 * Form-Level Error Display
                 * Shows general server errors that aren't tied to specific fields.
                 */}
                {serverState.formError && (
                    <p className={FORM_ERROR_CLASS}>{serverState.formError}</p>
                )}

                {/* 
                 * Form Action Section
                 * 
                 * Only rendered when canSubmit=true (user has edit permission).
                 * Submit button is disabled during pending server request (isPending=true).
                 * Button text changes to indicate loading state.
                 */}
                {canSubmit && (
                    <div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className={BUTTON_PRIMARY_CLASS}
                        >
                            {isPending ? 'Saving...' : 'Save Ticket'}
                        </button>
                    </div>
                )}
            </form>
        </>
    )
}
