'use client'

/**
 * AUTO-GENERATED MODULE DOC
 * Shared UI component module for 'SlideOverShell'.
 */
import React from 'react'

interface SlideOverShellProps {
  children: React.ReactNode
  title: string
  onClose: () => void
  closeAriaLabel?: string
  side?: 'left' | 'right'
  zIndexClassName?: string
  panelWidthClassName?: string
}

const DEFAULT_PANEL_WIDTH_CLASS_NAME = 'w-full sm:w-2/5'

export default function SlideOverShell({
  children,
  title,
  onClose,
  closeAriaLabel = 'Close dialog',
  side = 'right',
  zIndexClassName = 'z-50',
  panelWidthClassName = DEFAULT_PANEL_WIDTH_CLASS_NAME,
}: SlideOverShellProps) {
  const containerJustifyClassName = side === 'left' ? 'justify-start' : 'justify-end'
  const animationName = side === 'left' ? 'slide-in-left' : 'slide-in-right'
  const borderClassName = side === 'left' ? 'border-r' : 'border-l'
  const panelRadiusStyle =
    side === 'left'
      ? { borderTopRightRadius: 8, borderBottomRightRadius: 8 }
      : { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }
  const panelStyle = {
    ...panelRadiusStyle,
    animation: `${animationName} 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
  }

  return (
    <div
      className={`fixed inset-0 ${zIndexClassName} flex items-end ${containerJustifyClassName} bg-black/40`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`h-screen bg-white shadow-xl ${borderClassName} rounded-none flex flex-col ${panelWidthClassName}`}
        style={panelStyle}
      >
        <div className="mb-4 flex items-center justify-between border-b pb-2 p-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded border px-2 py-1 text-sm hover:bg-slate-100"
            aria-label={closeAriaLabel}
          >
            X
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
      <style jsx global>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes slide-in-left {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
