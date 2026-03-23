'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { loginFromFormState, type LoginResult } from '@/server/data/auth'
import { BUTTON_PRIMARY_CLASS, BUTTON_SECONDARY_CLASS } from '@/components/ui/classTokens'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

const initialLoginState: LoginResult = {
  success: false,
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter()
  const formRef = React.useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = React.useActionState(loginFromFormState, initialLoginState)

  React.useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, isPending, onClose])

  React.useEffect(() => {
    if (!state.success) {
      return
    }

    formRef.current?.reset()
    onClose()
    router.refresh()
  }, [onClose, router, state.success])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      onClick={() => {
        if (!isPending) {
          onClose()
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 id="login-modal-title" className="text-lg font-semibold text-gray-900">
            Login
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className={BUTTON_SECONDARY_CLASS}
            aria-label="Close login dialog"
          >
            X
          </button>
        </div>

        <form ref={formRef} action={formAction} className="space-y-4 p-4">
          <div className="space-y-1">
            <label htmlFor="login-identifier" className="block text-sm font-medium text-gray-700">
              Employee Number or Network User Name
            </label>
            <input
              id="login-identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500"
            />
          </div>

          {state.message ? (
            <p className="text-sm text-red-600" role="alert">
              {state.message}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className={BUTTON_SECONDARY_CLASS}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={BUTTON_PRIMARY_CLASS}
            >
              {isPending ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

