import {
  USER_TYPE_IDS,
  getUserTypeLabel,
  hasAdminFlag,
  isAdminEligibleUserType,
  isKnownUserTypeID,
  toKnownUserTypeID,
} from '@/lib/auth/roles'

describe('auth role helper utilities', () => {
  it('maps known user type ids and rejects unknown values', () => {
    expect(isKnownUserTypeID(USER_TYPE_IDS.qualityEngineer)).toBe(true)
    expect(isKnownUserTypeID(999)).toBe(false)
    expect(isKnownUserTypeID(null)).toBe(false)

    expect(toKnownUserTypeID(USER_TYPE_IDS.cellLeader)).toBe(USER_TYPE_IDS.cellLeader)
    expect(toKnownUserTypeID(999)).toBeNull()
    expect(toKnownUserTypeID(undefined)).toBeNull()
  })

  it('returns labels only for known user types', () => {
    expect(getUserTypeLabel(USER_TYPE_IDS.metrologyProgrammer)).toBe('Metrology Programmer')
    expect(getUserTypeLabel(999)).toBeUndefined()
  })

  it('checks admin eligible user types and admin flags', () => {
    expect(isAdminEligibleUserType(USER_TYPE_IDS.metrologyProgrammer)).toBe(true)
    expect(isAdminEligibleUserType(USER_TYPE_IDS.qualityEngineer)).toBe(false)

    expect(hasAdminFlag(true)).toBe(true)
    expect(hasAdminFlag(1)).toBe(true)
    expect(hasAdminFlag(0)).toBe(false)
    expect(hasAdminFlag(null)).toBe(false)
  })
})

