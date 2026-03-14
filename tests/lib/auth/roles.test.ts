import { isEffectiveAdmin, USER_TYPE_IDS } from '@/lib/auth/roles'

describe('auth roles admin eligibility', () => {
  it('returns true only for user types 1 or 2 with IsAdmin enabled', () => {
    expect(isEffectiveAdmin({ UserTypeID: USER_TYPE_IDS.metrologyProgrammer, IsAdmin: 1 })).toBe(true)
    expect(isEffectiveAdmin({ UserTypeID: USER_TYPE_IDS.metrologyCalibrationTechnician, IsAdmin: true })).toBe(true)

    expect(isEffectiveAdmin({ UserTypeID: USER_TYPE_IDS.metrologyProgrammer, IsAdmin: 0 })).toBe(false)
    expect(isEffectiveAdmin({ UserTypeID: USER_TYPE_IDS.metrologyCalibrationTechnician, IsAdmin: false })).toBe(false)
  })

  it('does not grant admin to non-eligible user types even with IsAdmin set', () => {
    expect(isEffectiveAdmin({ UserTypeID: USER_TYPE_IDS.qualityEngineer, IsAdmin: 1 })).toBe(false)
    expect(isEffectiveAdmin({ UserTypeID: USER_TYPE_IDS.manufacturingEngineer, IsAdmin: true })).toBe(false)
    expect(isEffectiveAdmin({ UserTypeID: USER_TYPE_IDS.cellLeader, IsAdmin: 1 })).toBe(false)
  })
})

