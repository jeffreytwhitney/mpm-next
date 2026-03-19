'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createTaskTimeEntryAction } from '@/features/tasks/actions/createTaskTimeEntryAction'
import { INITIAL_CREATE_TASK_TIME_ENTRY_STATE } from '@/features/tasks/actions/taskEntryActionTypes'
import { TASK_DETAIL_REFRESH_EVENT } from '@/features/tasks/taskDetailEvents'

interface TaskTimeEntryFormProps {
  taskId: number
  closeOnSuccess?: boolean
}

function todayInputValue() {
  return new Date().toISOString().split('T')[0]
}

export function TaskTimeEntryForm({ taskId, closeOnSuccess = false }: TaskTimeEntryFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState(
    createTaskTimeEntryAction.bind(null, taskId),
    INITIAL_CREATE_TASK_TIME_ENTRY_STATE,
  )

  useEffect(() => {
    if (!state.success) {
      return
    }

    formRef.current?.reset()
    window.dispatchEvent(new CustomEvent(TASK_DETAIL_REFRESH_EVENT, { detail: { taskId } }))

    if (closeOnSuccess) {
      router.back()
    }
  }, [closeOnSuccess, router, state.success, taskId])

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="entryDate" className="mb-1 block text-sm font-medium">
            Entry date
          </label>
          <input
            id="entryDate"
            name="entryDate"
            type="date"
            required
            defaultValue={todayInputValue()}
            className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          />
          {state.fieldErrors.entryDate && <p className="mt-1 text-xs text-red-600">{state.fieldErrors.entryDate}</p>}
        </div>

        <div>
          <label htmlFor="hours" className="mb-1 block text-sm font-medium">
            Hours
          </label>
          <input
            id="hours"
            name="hours"
            type="number"
            min="0.25"
            max="24"
            step="0.25"
            required
            className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          />
          {state.fieldErrors.hours && <p className="mt-1 text-xs text-red-600">{state.fieldErrors.hours}</p>}
        </div>
      </div>

      {state.formError && <p className="text-sm text-red-600">{state.formError}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
      >
        {isPending ? 'Saving...' : 'Save time entry'}
      </button>
    </form>
  )
}

