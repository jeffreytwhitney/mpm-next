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

