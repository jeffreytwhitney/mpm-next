'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createTaskTimeEntryAction } from '@/features/tasks/actions/createTaskTimeEntryAction'
import { INITIAL_CREATE_TASK_TIME_ENTRY_STATE } from '@/features/tasks/actions/taskEntryActionTypes'
import { BUTTON_PRIMARY_CLASS, LABEL_CLASS, INPUT_CLASS, ERROR_TEXT_CLASS, FORM_ERROR_CLASS } from '@/components/ui/classTokens'

const TASK_DETAIL_REFRESH_EVENT = 'task-detail:refresh'

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
          <label htmlFor="entryDate" className={LABEL_CLASS}>
            Entry date
          </label>
          <input
            id="entryDate"
            name="entryDate"
            type="date"
            required
            defaultValue={todayInputValue()}
            className={INPUT_CLASS}
          />
          {state.fieldErrors.entryDate && <p className={ERROR_TEXT_CLASS}>{state.fieldErrors.entryDate}</p>}
        </div>

        <div>
          <label htmlFor="hours" className={LABEL_CLASS}>
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
            className={INPUT_CLASS}
          />
          {state.fieldErrors.hours && <p className={ERROR_TEXT_CLASS}>{state.fieldErrors.hours}</p>}
        </div>
      </div>

      {state.formError && <p className={FORM_ERROR_CLASS}>{state.formError}</p>}

      <button
        type="submit"
        disabled={isPending}
        className={BUTTON_PRIMARY_CLASS}
      >
        {isPending ? 'Saving...' : 'Save time entry'}
      </button>
    </form>
  )
}

