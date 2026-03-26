/**
 * Current User Type Definitions
 *
 * Defines the CurrentUser interface used throughout the application for type-safe
 * access to authenticated user information. Includes:
 * - User identity (ID, employee number, network name)
 * - User type and admin status for authorization checks
 * - Department and site assignments
 * - Display names for UI rendering
 */
import type { KnownUserTypeID } from '@/lib/auth/roles'

export interface CurrentUser {
  userId: number
  userTypeID: number | null
  userType: KnownUserTypeID | null
  isAdmin: boolean
  siteID: number | null
  departmentID: number | null
  employeeNumber: string | null
  networkUserName: string | null
  displayName: string | null
  fullName: string | null
}

