'use server'

/**
 * Authentication Data Access Module
 *
 * Handles user authentication flows including:
 * - Credential verification and password validation
 * - Session management (creation, validation, clearing)
 * - Permission checking at action level
 *
 * Works in conjunction with session and permission modules to provide
 * a complete authentication and authorization system.
 */
import { hasPermission, type AppPermission } from '@/lib/auth/permissions'
import {
  clearSessionCookie,
  getSessionUser,
  setSessionCookie,
  toSessionUser,
  type SessionUser,
} from '@/lib/auth/session'
import { verifyUserCredentials } from '@/server/data/user'

export interface LoginResult {
  success: boolean
  message?: string
  user?: SessionUser
}

export async function loginFromFormState(_previousState: LoginResult, formData: FormData): Promise<LoginResult> {
  const identifier = String(formData.get('identifier') ?? '')
  const password = String(formData.get('password') ?? '')

  return login(identifier, password)
}

export async function login(identifier: string, password: string): Promise<LoginResult> {
  const normalizedIdentifier = identifier.trim()

  if (!normalizedIdentifier || !password) {
    return {
      success: false,
      message: 'Identifier and password are required',
    }
  }

  const user = await verifyUserCredentials(normalizedIdentifier, password)

  if (!user) {
    return {
      success: false,
      message: 'Invalid credentials',
    }
  }

  const sessionUser = toSessionUser(user)
  await setSessionCookie(sessionUser)

  return {
    success: true,
    user: sessionUser,
  }
}

export async function logout(): Promise<void> {
  await clearSessionCookie()
}

export async function getCurrentSessionUser(): Promise<SessionUser | null> {
  return getSessionUser()
}

export async function currentUserHasPermission(permission: AppPermission): Promise<boolean> {
  const sessionUser = await getCurrentSessionUser()
  return hasPermission(
    sessionUser ? { UserTypeID: sessionUser.userTypeID, IsAdmin: sessionUser.isAdmin } : null,
    permission,
  )
}

