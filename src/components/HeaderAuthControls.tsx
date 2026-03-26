'use client'

/**
 * AUTO-GENERATED MODULE DOC
 * Shared UI component module for 'HeaderAuthControls'.
 */
import React from 'react'
import { useRouter } from 'next/navigation'
import { LoginModal } from '@/components/LoginModal'
import { logout } from '@/server/data/auth'

interface HeaderAuthControlsProps {
  userLabel?: string
  fullName?: string
  isAnonymous: boolean
}

export function HeaderAuthControls({ userLabel, fullName, isAnonymous }: HeaderAuthControlsProps) {
  const router = useRouter()
  const [isLoginOpen, setIsLoginOpen] = React.useState(false)
  const [isLoggingOut, startLogoutTransition] = React.useTransition()
  const displayLabel = userLabel ?? fullName ?? 'Anonymous'

  return (
    <>
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span className="font-medium text-gray-900">{displayLabel}</span>
        {isAnonymous ? (
          <button
            type="button"
            onClick={() => setIsLoginOpen(true)}
            className="text-blue-600 underline-offset-2 hover:underline"
          >
            Login
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              startLogoutTransition(async () => {
                await logout()
                router.refresh()
              })
            }}
            disabled={isLoggingOut}
            className="text-blue-600 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        )}
      </div>

      {isAnonymous ? (
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
        />
      ) : null}
    </>
  )
}

