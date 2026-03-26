'use client'

/**
 * AUTO-GENERATED MODULE DOC
 * Feature module for 'tickets' domain behavior.
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

/** Emitted after a successful save so modal shells can close themselves. */
const TICKET_DETAIL_SAVED_EVENT = 'ticket-detail:saved'

/**
 * Client-side props for rendering and submitting the ticket detail form.
 */
interface TicketDetailFormProps {
    ticketId: number
    ticketDetail: TicketDetailModel
    qualityEngineerOptions: UserDropDownOption[]
    manufacturingEngineerOptions: UserDropDownOption[]
    canSubmit: boolean
}

type FieldErrors = UpdateTicketFieldErrors

/**
 * Performs lightweight client validation so users get immediate feedback
 * before the server action runs.
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
 * Server data and permission decisions are resolved upstream in
 * `TicketDetailContent`; this component focuses on interaction,
 * validation, and submission state.
 */
export function TicketDetailForm({
    ticketId,
    ticketDetail,
    qualityEngineerOptions,
    manufacturingEngineerOptions,
    canSubmit,
}: TicketDetailFormProps) {
    const {ticket, tasks, departmentName, submitterName} = ticketDetail
    const [errors, setErrors] = React.useState<FieldErrors>({})
    const [showCompletedTasks, setShowCompletedTasks] = React.useState<boolean>(false)
    const router = useRouter()
    const [serverState, updateTicket, isPending] = useActionState(
        updateTicketAction.bind(null, ticketId),
        INITIAL_UPDATE_TICKET_STATE,
    )

    React.useEffect(() => {
        if (!serverState.success) {
            return
        }
        window.dispatchEvent(new CustomEvent(TICKET_DETAIL_SAVED_EVENT, {detail: {ticketId}}))
    }, [serverState.success, ticketId])

    const displayErrors: FieldErrors = {
        ...serverState.fieldErrors,
        ...errors,
    }

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

    // Filter tasks: hide Completed (4) and Cancelled (5) by default
    const filteredTasks = tasks.filter((task) => {
        const isCompleted = task.StatusID === 4 || task.StatusID === 5
        return showCompletedTasks || !isCompleted
    })


    return (
        <>
            <div className="-mt-4 mb-4">
                <div className="flex flex-wrap justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => router.push(`/tickets/${ticketId}/tasks/new`)}
                        className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-100 flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Task
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push(`/tickets/${ticketId}/tasks/group-edit`)}
                        className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-100 flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Group Edit
                    </button>
                </div>
            </div>

            <form action={updateTicket} onSubmit={handleSubmit} className="space-y-6 text-sm" suppressHydrationWarning>
                {/* Ticket Info Section */}
                <div className="border-b pb-4">
                    <h3 className="font-semibold mb-3">Ticket Information</h3>
                    <div className="grid grid-cols-[12rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2">
                        <span className="font-medium pt-1">Ticket Number</span>
                        <span className="pt-1">{ticket.TicketNumber ?? ''}</span>

                        {/* Ticket Name */}
                        <label htmlFor="ticketName" className="font-medium pt-1">
                            Ticket Name {canSubmit && <span className="text-red-500">*</span>}
                        </label>
                        <div>
                            <input
                                id="ticketName"
                                name="ticketName"
                                defaultValue={ticket.ProjectName ?? ''}
                                disabled={!canSubmit}
                                className="rounded border border-gray-300 bg-white px-2 py-1 w-full max-w-lg disabled:bg-gray-100"
                                suppressHydrationWarning
                            />
                            {displayErrors.ticketName && (
                                <p className="mt-0.5 text-xs text-red-600">{displayErrors.ticketName}</p>
                            )}
                        </div>

                        {/* Ticket Description */}
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
                                className="rounded border border-gray-300 bg-white px-2 py-1 w-full max-w-lg disabled:bg-gray-100"
                                suppressHydrationWarning
                            />
                        </div>

                        {/* Department */}
                        <span className="font-medium pt-1">Department</span>
                        <span className="pt-1">{departmentName ?? '-'}</span>

                        {/* Primary Project Owner (Manufacturing Engineer) */}
                        <label htmlFor="primaryProjectOwnerID" className="font-medium pt-1">
                            Manufacturing Engineer
                        </label>
                        <div>
                            <select
                                id="primaryProjectOwnerID"
                                name="primaryProjectOwnerID"
                                defaultValue={ticket.PrimaryProjectOwnerID ?? ''}
                                disabled={!canSubmit}
                                className="rounded border border-gray-300 bg-white px-2 py-1 w-full max-w-lg disabled:bg-gray-100"
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
                                <p className="mt-0.5 text-xs text-red-600">{displayErrors.primaryProjectOwnerID}</p>
                            )}
                        </div>

                        {/* Secondary Project Owner (Quality Engineer) */}
                        <label htmlFor="secondaryProjectOwnerID" className="font-medium pt-1">
                            Quality Engineer {canSubmit && <span className="text-red-500">*</span>}
                        </label>
                        <div>
                            <select
                                id="secondaryProjectOwnerID"
                                name="secondaryProjectOwnerID"
                                defaultValue={ticket.SecondaryProjectOwnerID ?? ''}
                                disabled={!canSubmit}
                                className="rounded border border-gray-300 bg-white px-2 py-1 w-full max-w-lg disabled:bg-gray-100"
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
                                <p className="mt-0.5 text-xs text-red-600">{displayErrors.secondaryProjectOwnerID}</p>
                            )}
                        </div>

                        {/* Requires Models */}
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

                        {/* Display Context Info */}
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

                {/* Tasks Section */}
                <div className="border-b pb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">Tasks ({filteredTasks.length})</h3>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showCompletedTasks}
                                    onChange={(e) => setShowCompletedTasks(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <span>Show completed tasks</span>
                            </label>
                        </div>
                    </div>

                    {filteredTasks.length === 0 ? (
                        <p className="text-xs text-slate-500">No tasks.</p>
                    ) : (
                        <div className="overflow-x-auto border border-gray-200 rounded">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="text-left px-3 py-2 font-semibold">Task Name</th>
                                        <th className="text-left px-3 py-2 font-semibold">Op #</th>
                                        <th className="text-left px-3 py-2 font-semibold">Status</th>
                                        <th className="text-left px-3 py-2 font-semibold">Assignee</th>
                                        <th className="text-left px-3 py-2 font-semibold">Due Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTasks.map((task) => (
                                        <tr key={task.ID} className="border-b hover:bg-gray-50">
                                            <td className="px-3 py-2">
                                                <a href={`/tasks/${task.ID}`} className="text-blue-600 hover:underline">
                                                    {task.TaskName}
                                                </a>
                                            </td>
                                            <td className="px-3 py-2">{task.Operation ?? '-'}</td>
                                            <td className="px-3 py-2">{task.Status ?? '-'}</td>
                                            <td className="px-3 py-2">{task.AssignedToName ?? '-'}</td>
                                            <td className="px-3 py-2">
                                                {task.DueDate
                                                    ? new Date(task.DueDate).toLocaleDateString('en-US')
                                                    : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Form Actions */}
                {serverState.formError && (
                    <p className="text-sm text-red-600">{serverState.formError}</p>
                )}

                {canSubmit && (
                    <div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                        >
                            {isPending ? 'Saving...' : 'Save Ticket'}
                        </button>
                    </div>
                )}
            </form>
        </>
    )
}
