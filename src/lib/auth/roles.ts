export const USER_TYPES = {
  METROLOGY_PROGRAMMER: 1,
  METROLOGY_CALIBRATION_TECHNICIAN: 2,
  QUALITY_ENGINEER: 3,
  MANUFACTURING_ENGINEER: 4,
  CELL_LEADER: 5,
} as const

export const USER_TYPE_IDS = {
  metrologyProgrammer: USER_TYPES.METROLOGY_PROGRAMMER,
  metrologyCalibrationTechnician: USER_TYPES.METROLOGY_CALIBRATION_TECHNICIAN,
  qualityEngineer: USER_TYPES.QUALITY_ENGINEER,
  manufacturingEngineer: USER_TYPES.MANUFACTURING_ENGINEER,
  cellLeader: USER_TYPES.CELL_LEADER,
} as const

export type KnownUserTypeID = (typeof USER_TYPE_IDS)[keyof typeof USER_TYPE_IDS]

export function toKnownUserTypeID(userTypeID: number | null | undefined): KnownUserTypeID | null {
  return isKnownUserTypeID(userTypeID) ? userTypeID : null
}

export const ADMIN_ELIGIBLE_USER_TYPE_IDS = [
  USER_TYPE_IDS.metrologyProgrammer,
  USER_TYPE_IDS.metrologyCalibrationTechnician,
] as const

export const USER_TYPE_LABELS: Record<KnownUserTypeID, string> = {
  [USER_TYPE_IDS.metrologyProgrammer]: 'Metrology Programmer',
  [USER_TYPE_IDS.metrologyCalibrationTechnician]: 'Metrology Calibration Technician',
  [USER_TYPE_IDS.qualityEngineer]: 'Quality Engineer',
  [USER_TYPE_IDS.manufacturingEngineer]: 'Manufacturing Engineer',
  [USER_TYPE_IDS.cellLeader]: 'Cell Leader',
}

export interface RoleAwareUser {
  ID: number
  UserTypeID: number | null
  IsAdmin?: number | boolean | null
}

export function isKnownUserTypeID(userTypeID: number | null | undefined): userTypeID is KnownUserTypeID {
  return typeof userTypeID === 'number' && Object.values(USER_TYPE_IDS).includes(userTypeID as KnownUserTypeID)
}

export function getUserTypeLabel(userTypeID: number | null | undefined): string | undefined {
  return isKnownUserTypeID(userTypeID) ? USER_TYPE_LABELS[userTypeID] : undefined
}

export function isAdminEligibleUserType(
  userTypeID: number | null | undefined,
): userTypeID is (typeof ADMIN_ELIGIBLE_USER_TYPE_IDS)[number] {
  return (
    typeof userTypeID === 'number' &&
    ADMIN_ELIGIBLE_USER_TYPE_IDS.includes(userTypeID as (typeof ADMIN_ELIGIBLE_USER_TYPE_IDS)[number])
  )
}

export function hasAdminFlag(isAdmin: number | boolean | null | undefined): boolean {
  if (typeof isAdmin === 'boolean') {
    return isAdmin
  }

  return isAdmin === 1
}

export function isEffectiveAdmin(
  user: Pick<RoleAwareUser, 'UserTypeID' | 'IsAdmin'> | null | undefined,
): boolean {
  return Boolean(user && isAdminEligibleUserType(user.UserTypeID) && hasAdminFlag(user.IsAdmin))
}

