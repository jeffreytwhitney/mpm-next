'use client'

import React from 'react'
import type { CurrentUser } from '@/lib/auth/currentUserTypes'

interface AuthUserContextValue {
  user: CurrentUser | null
}

const AuthUserContext = React.createContext<AuthUserContextValue | undefined>(undefined)

interface AuthUserProviderProps {
  children: React.ReactNode
  initialUser: CurrentUser | null
}

export function AuthUserProvider({ children, initialUser }: AuthUserProviderProps) {
  const value = React.useMemo(
    () => ({
      user: initialUser,
    }),
    [initialUser],
  )

  return <AuthUserContext.Provider value={value}>{children}</AuthUserContext.Provider>
}

export function useAuthUser() {
  const context = React.useContext(AuthUserContext)

  if (!context) {
    throw new Error('useAuthUser must be used within an AuthUserProvider')
  }

  return context.user
}

