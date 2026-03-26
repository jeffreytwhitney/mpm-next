/**
 * Permission and Authorization Module
 *
 * Defines application-level permissions and enforces authorization rules.
 * Maps permissions to eligible user types and handles:
 * - Ticket creation and management permissions
 * - Task management permissions
 * - Service ticket operations
 * - Programming task operations
 * - Department-scoped permission checks for ticket ownership
 *
 * Used by server actions to validate user capabilities before mutations.
 */
import { isEffectiveAdmin, USER_TYPE_IDS, type KnownUserTypeID, type RoleAwareUser } from '@/lib/auth/roles'

export type AppPermission =
  | 'programmingTasks.manage'
  | 'serviceTickets.manage'
  | 'tickets.create'
  | 'tickets.addTasks'

/**
 * Minimal user shape needed for permission checks across app features.
 */
export interface PermissionAwareUser extends RoleAwareUser {
  EmployeeNumber?: string | null
  NetworkUserName?: string | null
  DisplayName?: string | null
  FullName?: string | null
}

/**
 * User shape needed when evaluating ticket-edit permissions.
 */
export interface TicketEditPermissionAwareUser extends Pick<PermissionAwareUser, 'UserTypeID' | 'IsAdmin'> {
  DepartmentID?: number | null
}

/** Map of app permission keys to allowed non-admin user types. */
const permissionMatrix: Record<AppPermission, readonly KnownUserTypeID[]> = {
  'programmingTasks.manage': [USER_TYPE_IDS.metrologyProgrammer],
  'serviceTickets.manage': [
    USER_TYPE_IDS.metrologyProgrammer,
    USER_TYPE_IDS.metrologyCalibrationTechnician,
  ],
  'tickets.create': [
    USER_TYPE_IDS.metrologyProgrammer,
    USER_TYPE_IDS.qualityEngineer,
  ],
  'tickets.addTasks': [
    USER_TYPE_IDS.metrologyProgrammer,
    USER_TYPE_IDS.qualityEngineer,
  ],
}

/**
 * Returns `true` when the user is effectively admin or holds the requested permission.
 */
export function hasPermission(
  user: Pick<PermissionAwareUser, 'UserTypeID' | 'IsAdmin'> | null | undefined,
  permission: AppPermission,
): boolean {
  if (isEffectiveAdmin(user)) {
    return true
  }

  if (!user?.UserTypeID) {
    return false
  }

  return permissionMatrix[permission].includes(user.UserTypeID as KnownUserTypeID)
}

/** Convenience guard for programming task management features. */
export function canManageProgrammingTasks(
  user: Pick<PermissionAwareUser, 'UserTypeID' | 'IsAdmin'> | null | undefined,
): boolean {
  return hasPermission(user, 'programmingTasks.manage')
}

/** Convenience guard for service ticket management features. */
export function canManageServiceTickets(
  user: Pick<PermissionAwareUser, 'UserTypeID' | 'IsAdmin'> | null | undefined,
): boolean {
  return hasPermission(user, 'serviceTickets.manage')
}

/** Convenience guard for ticket creation flows. */
export function canCreateTickets(
  user: Pick<PermissionAwareUser, 'UserTypeID' | 'IsAdmin'> | null | undefined,
): boolean {
  return hasPermission(user, 'tickets.create')
}

/** Convenience guard for adding tasks to tickets. */
export function canAddTasksToTickets(
  user: Pick<PermissionAwareUser, 'UserTypeID' | 'IsAdmin'> | null | undefined,
): boolean {
  return hasPermission(user, 'tickets.addTasks')
}

/**
 * Determines whether a user can edit a specific ticket.
 *
 * Rules:
 * - admins: always allowed
 * - programmers/calibration techs: always allowed
 * - quality engineers: allowed only for matching department
 */
export function canEditTicket(
  user: TicketEditPermissionAwareUser | null | undefined,
  ticketDepartmentID: number | null | undefined,
): boolean {
  if (isEffectiveAdmin(user)) {
    return true
  }

  if (!user?.UserTypeID) {
    return false
  }

  if (
    user.UserTypeID === USER_TYPE_IDS.metrologyProgrammer ||
    user.UserTypeID === USER_TYPE_IDS.metrologyCalibrationTechnician
  ) {
    return true
  }

  return (
    user.UserTypeID === USER_TYPE_IDS.qualityEngineer &&
    ticketDepartmentID != null &&
    user.DepartmentID === ticketDepartmentID
  )
}

/**
 * Asserts user authentication and returns a non-null user.
 */
export function requireAuthenticatedUser<TUser>(user: TUser | null | undefined): TUser {
  if (!user) {
    throw new Error('Authentication required')
  }

  return user
}

/**
 * Asserts both authentication and a specific permission.
 */
export function requirePermission<TUser extends Pick<PermissionAwareUser, 'UserTypeID' | 'IsAdmin'>>(
  user: TUser | null | undefined,
  permission: AppPermission,
): TUser {
  const authenticatedUser = requireAuthenticatedUser(user)

  if (!hasPermission(authenticatedUser, permission)) {
    throw new Error(`Permission denied: ${permission}`)
  }

  return authenticatedUser
}

/**
 * Asserts both authentication and ticket edit capability.
 */
export function requireTicketEditPermission<TUser extends TicketEditPermissionAwareUser>(
  user: TUser | null | undefined,
  ticketDepartmentID: number | null | undefined,
): TUser {
  const authenticatedUser = requireAuthenticatedUser(user)

  if (!canEditTicket(authenticatedUser, ticketDepartmentID)) {
    throw new Error('Permission denied: tickets.edit')
  }

  return authenticatedUser
}

