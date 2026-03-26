/**
 * Current User Resolution Module
 *
 * Provides cached functions for resolving the authenticated user in server components.
 * Uses React cache() to deduplicate user lookups within a single request.
 * Handles:
 * - Session user validation
 * - Full user record loading from database
 * - Converting records to CurrentUser shape for use in components
 * - Enforcing authentication with requireCurrentUser()
 */
import { cache } from 'react'
import { getUserById, type MPMUser } from '@/server/data/user'
import { getSessionUser, type SessionUser } from '@/lib/auth/session'
import type { CurrentUser } from '@/lib/auth/currentUserTypes'
import { toKnownUserTypeID } from '@/lib/auth/roles'

function toCurrentUser(record: MPMUser, sessionUser: SessionUser): CurrentUser {
  return {
    userId: record.ID,
    userTypeID: record.UserTypeID ?? null,
    userType: toKnownUserTypeID(record.UserTypeID),
    isAdmin: sessionUser.isAdmin,
    siteID: record.SiteID ?? null,
    departmentID: record.DepartmentID ?? null,
    employeeNumber: record.EmployeeNumber ?? null,
    networkUserName: record.NetworkUserName ?? null,
    displayName: record.DisplayName ?? null,
    fullName: record.FullName ?? null,
  }
}

export const getCurrentSessionUserCached = cache(async (): Promise<SessionUser | null> => {
  return getSessionUser()
})

export const getCurrentUserRecord = cache(async (): Promise<MPMUser | null> => {
  const sessionUser = await getCurrentSessionUserCached()

  if (!sessionUser) {
    return null
  }

  return getUserById(sessionUser.userId)
})

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const [sessionUser, userRecord] = await Promise.all([getCurrentSessionUserCached(), getCurrentUserRecord()])

  if (!sessionUser || !userRecord) {
    return null
  }

  return toCurrentUser(userRecord, sessionUser)
})

export const requireCurrentUserRecord = cache(async (): Promise<MPMUser> => {
  const userRecord = await getCurrentUserRecord()

  if (!userRecord) {
    throw new Error('Unauthorized')
  }

  return userRecord
})

export const requireCurrentUser = cache(async (): Promise<CurrentUser> => {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
})

