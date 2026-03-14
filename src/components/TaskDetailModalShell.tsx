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
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="h-screen w-full sm:w-3/5 bg-white shadow-xl border-l rounded-none flex flex-col animate-slide-in-right"
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

