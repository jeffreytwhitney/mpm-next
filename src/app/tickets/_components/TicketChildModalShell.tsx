'use client'

/**
 * AUTO-GENERATED MODULE DOC
 * App Router module for route composition and rendering.
 */
import React, { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const TASK_ADDED_EVENT = 'ticket-task:added'

interface TicketChildModalShellProps {
  children: React.ReactNode
  title: string
}

export default function TicketChildModalShell({ children, title }: TicketChildModalShellProps) {
  const router = useRouter()

  const closeModal = useCallback(() => {
	if (window.history.length > 1) {
	  router.back()
	  return
	}

	router.push('/tickets')
  }, [router])

  useEffect(() => {
	const handleTaskAdded = () => {
	  closeModal()
	}

	window.addEventListener(TASK_ADDED_EVENT, handleTaskAdded)

	return () => {
	  window.removeEventListener(TASK_ADDED_EVENT, handleTaskAdded)
	}
  }, [closeModal])

  return (
	<div className="fixed inset-0 z-70 flex items-center justify-center bg-black/55" role="dialog" aria-modal="true" aria-label={title}>
	  <div className="w-full max-w-2xl rounded-lg border bg-white p-4 shadow-xl">
		<div className="mb-4 flex items-center justify-between border-b pb-2">
		  <h2 className="text-lg font-semibold">{title}</h2>
		  <button
			type="button"
			onClick={closeModal}
			className="rounded border px-2 py-1 text-sm hover:bg-slate-100"
			aria-label="Close add task dialog"
		  >
			X
		  </button>
		</div>
		{children}
	  </div>
	</div>
  )
}
