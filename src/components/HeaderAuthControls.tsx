'use client'

import React from 'react'
import { LoginModal } from '@/components/LoginModal'

interface HeaderAuthControlsProps {
  userLabel?: string
  fullName?: string
  isAnonymous: boolean
}

export function HeaderAuthControls({ userLabel, fullName, isAnonymous }: HeaderAuthControlsProps) {
  const [isLoginOpen, setIsLoginOpen] = React.useState(false)
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
        ) : null}
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

