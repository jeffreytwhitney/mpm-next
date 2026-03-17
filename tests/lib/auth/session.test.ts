import { createSessionToken, verifySessionToken } from '@/lib/auth/session'
import { USER_TYPES } from '@/lib/auth/roles'

describe('auth session utilities', () => {
  const originalJwtSecret = process.env.JWT_SECRET

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-session-secret'
  })

  afterAll(() => {
    process.env.JWT_SECRET = originalJwtSecret
  })

  it('creates and verifies a JWT session token', async () => {
    const token = await createSessionToken({
      userId: 10,
      userTypeID: 1,
      userType: USER_TYPES.METROLOGY_PROGRAMMER,
      isAdmin: true,
      employeeNumber: '4404',
      networkUserName: 'jdoe',
      displayName: 'John Doe',
      fullName: 'John Doe',
    })

    await expect(verifySessionToken(token)).resolves.toEqual({
      userId: 10,
      userTypeID: 1,
      userType: USER_TYPES.METROLOGY_PROGRAMMER,
      isAdmin: true,
      employeeNumber: '4404',
      networkUserName: 'jdoe',
      displayName: 'John Doe',
      fullName: 'John Doe',
    })
  })

  it('returns null for a tampered token', async () => {
    const token = await createSessionToken({
      userId: 10,
      userTypeID: 1,
      userType: USER_TYPES.METROLOGY_PROGRAMMER,
      isAdmin: false,
      employeeNumber: '4404',
      networkUserName: 'jdoe',
      displayName: 'John Doe',
      fullName: 'John Doe',
    })

    const tamperedToken = `${token.slice(0, -1)}x`

    await expect(verifySessionToken(tamperedToken)).resolves.toBeNull()
  })
})

