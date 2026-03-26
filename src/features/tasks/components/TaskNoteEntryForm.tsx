'use client'

/**
 * AUTO-GENERATED MODULE DOC
 * Feature module for 'tasks' domain behavior.
 */
import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createTaskNoteAction } from '@/features/tasks/actions/createTaskNoteAction'
import { INITIAL_CREATE_TASK_NOTE_STATE } from '@/features/tasks/actions/taskEntryActionTypes'
import { BUTTON_PRIMARY_CLASS, LABEL_CLASS, TEXTAREA_CLASS, ERROR_TEXT_CLASS, FORM_ERROR_CLASS } from '@/components/ui/classTokens'

const TASK_DETAIL_REFRESH_EVENT = 'task-detail:refresh'

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
        <label htmlFor="taskNote" className={LABEL_CLASS}>
          Note
        </label>
        <textarea
          id="taskNote"
          name="taskNote"
          rows={6}
          required
          className={TEXTAREA_CLASS}
        />
        {state.fieldErrors.taskNote && <p className={ERROR_TEXT_CLASS}>{state.fieldErrors.taskNote}</p>}
      </div>

      {state.formError && <p className={FORM_ERROR_CLASS}>{state.formError}</p>}

      <button
        type="submit"
        disabled={isPending}
        className={BUTTON_PRIMARY_CLASS}
      >
        {isPending ? 'Saving...' : 'Save note'}
      </button>
    </form>
  )
}

