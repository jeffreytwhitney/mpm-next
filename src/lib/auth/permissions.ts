import { isEffectiveAdmin, USER_TYPE_IDS, type KnownUserTypeID, type RoleAwareUser } from '@/lib/auth/roles'

export type AppPermission =
  | 'programmingTasks.manage'
  | 'serviceTickets.manage'
  | 'tickets.create'
  | 'tickets.addTasks'

export interface PermissionAwareUser extends RoleAwareUser {
  EmployeeNumber?: string | null
  NetworkUserName?: string | null
  DisplayName?: string | null
  FullName?: string | null
}

export interface TicketEditPermissionAwareUser extends Pick<PermissionAwareUser, 'UserTypeID' | 'IsAdmin'> {
  DepartmentID?: number | null
}

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

export function canManageProgrammingTasks(
  user: Pick<PermissionAwareUser, 'UserTypeID' | 'IsAdmin'> | null | undefined,
): boolean {
  return hasPermission(user, 'programmingTasks.manage')
}

export function canManageServiceTickets(
  user: Pick<PermissionAwareUser, 'UserTypeID' | 'IsAdmin'> | null | undefined,
): boolean {
  return hasPermission(user, 'serviceTickets.manage')
}

export function canCreateTickets(
  user: Pick<PermissionAwareUser, 'UserTypeID' | 'IsAdmin'> | null | undefined,
): boolean {
  return hasPermission(user, 'tickets.create')
}

export function canAddTasksToTickets(
  user: Pick<PermissionAwareUser, 'UserTypeID' | 'IsAdmin'> | null | undefined,
): boolean {
  return hasPermission(user, 'tickets.addTasks')
}

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

export function requireAuthenticatedUser<TUser>(user: TUser | null | undefined): TUser {
  if (!user) {
    throw new Error('Authentication required')
  }

  return user
}

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

