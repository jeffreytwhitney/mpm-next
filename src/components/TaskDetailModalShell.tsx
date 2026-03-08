'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

interface TaskDetailModalShellProps {
  children: React.ReactNode
  title: string
}

export default function TaskDetailModalShell({ children, title }: TaskDetailModalShellProps) {
  const router = useRouter()

  const closeModal = () => {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push('/tasks')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-3xl rounded-md border bg-white p-4 shadow-xl dark:bg-slate-950">
        <div className="mb-4 flex items-center justify-between border-b pb-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={closeModal}
            className="rounded border px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close task details"
          >
            X
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}

