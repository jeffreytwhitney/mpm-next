'use client'

/**
 * AUTO-GENERATED MODULE DOC
 * App Router module for route composition and rendering.
 */
import React, { useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface TaskChildModalShellProps {
  children: React.ReactNode
  title: string
  fallbackHref?: string
  zIndexClassName?: string
}

export default function TaskChildModalShell({
  children,
  title,
  fallbackHref = '/tasks',
  zIndexClassName = 'z-60',
}: TaskChildModalShellProps) {
  const router = useRouter()

  const closeModal = useCallback(() => {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push(fallbackHref)
  }, [fallbackHref, router])

  return (
    <div className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center bg-black/55`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-xl rounded-lg border bg-white p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b pb-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={closeModal}
            className="rounded border px-2 py-1 text-sm hover:bg-slate-100"
            aria-label="Close dialog"
          >
            X
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

