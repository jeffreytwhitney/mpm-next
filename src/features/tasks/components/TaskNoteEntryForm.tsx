'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createTaskNoteAction } from '@/features/tasks/actions/createTaskNoteAction'
import { INITIAL_CREATE_TASK_NOTE_STATE } from '@/features/tasks/actions/taskEntryActionTypes'
import { TASK_DETAIL_REFRESH_EVENT } from '@/features/tasks/taskDetailEvents'

interface TaskNoteEntryFormProps {
  taskId: number
  closeOnSuccess?: boolean
}

export function TaskNoteEntryForm({ taskId, closeOnSuccess = false }: TaskNoteEntryFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState(
    createTaskNoteAction.bind(null, taskId),
    INITIAL_CREATE_TASK_NOTE_STATE,
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
      <div>
        <label htmlFor="taskNote" className="mb-1 block text-sm font-medium">
          Note
        </label>
        <textarea
          id="taskNote"
          name="taskNote"
          rows={6}
          required
          className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
        />
        {state.fieldErrors.taskNote && <p className="mt-1 text-xs text-red-600">{state.fieldErrors.taskNote}</p>}
      </div>

      {state.formError && <p className="text-sm text-red-600">{state.formError}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
      >
        {isPending ? 'Saving...' : 'Save note'}
      </button>
    </form>
  )
}

