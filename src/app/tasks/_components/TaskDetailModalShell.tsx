'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'

const TASK_DETAIL_SAVED_EVENT = 'task-detail:saved'
const TASK_DETAIL_REFRESH_EVENT = 'task-detail:refresh'

interface TaskDetailModalShellProps {
  children: React.ReactNode
  title: string
}

export default function TaskDetailModalShell({ children, title }: TaskDetailModalShellProps) {
  const router = useRouter()

  const closeModal = useCallback(() => {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push('/tasks')
  }, [router])

  useEffect(() => {
    const handleTaskSaved = () => {
      closeModal()
    }

    const handleTaskRefresh = () => {
      router.refresh()
    }

    window.addEventListener(TASK_DETAIL_SAVED_EVENT, handleTaskSaved)
    window.addEventListener(TASK_DETAIL_REFRESH_EVENT, handleTaskRefresh)

    return () => {
      window.removeEventListener(TASK_DETAIL_SAVED_EVENT, handleTaskSaved)
      window.removeEventListener(TASK_DETAIL_REFRESH_EVENT, handleTaskRefresh)
    }
  }, [closeModal, router])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="h-screen w-full sm:w-2/5 bg-white shadow-xl border-l rounded-none flex flex-col animate-slide-in-right"
        style={{ borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }}
      >
        <div className="mb-4 flex items-center justify-between border-b pb-2 p-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={closeModal}
            className="rounded border px-2 py-1 text-sm hover:bg-slate-100"
            aria-label="Close task details"
          >
            X
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
      <style jsx global>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  )
}

