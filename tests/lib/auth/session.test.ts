import crypto from 'crypto'

const mockCookieSet = jest.fn()
const mockCookieDelete = jest.fn()
const mockCookieGet = jest.fn()
const mockCookies = jest.fn()
const mutableEnv = process.env as Record<string, string | undefined>

jest.mock('next/headers', () => ({
  cookies: (...args: unknown[]) => mockCookies(...args),
}))

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

import {
  clearSessionCookie,
  createSessionToken,
  getSessionUser,
  SESSION_COOKIE_NAME,
  setSessionCookie,
  toSessionUser,
  verifySessionToken,
} from '@/lib/auth/session'
import { USER_TYPES } from '@/lib/auth/roles'

describe('auth session utilities', () => {
  const originalJwtSecret = process.env.JWT_SECRET
  const originalNodeEnv = process.env.NODE_ENV

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-session-secret'
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockCookies.mockResolvedValue({
      set: mockCookieSet,
      delete: mockCookieDelete,
      get: mockCookieGet,
    })
    mutableEnv.NODE_ENV = 'test'
  })

  afterAll(() => {
    process.env.JWT_SECRET = originalJwtSecret
    mutableEnv.NODE_ENV = originalNodeEnv
  })

  function buildSignedToken(payload: Record<string, unknown>): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }), 'utf8').toString('base64url')
    const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
    const unsigned = `${header}.${encodedPayload}`
    const signature = crypto
      .createHmac('sha256', process.env.JWT_SECRET as string)
      .update(unsigned)
      .digest('base64url')
    return `${unsigned}.${signature}`
  }

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

  it('returns null for malformed tokens and invalid payloads', async () => {
    await expect(verifySessionToken('a.b')).resolves.toBeNull()

    const now = Math.floor(Date.now() / 1000)
    const badUserIdToken = buildSignedToken({
      iss: 'mpm-next',
      aud: 'mpm-next-app',
      iat: now,
      exp: now + 100,
      userId: 'not-a-number',
    })

    await expect(verifySessionToken(badUserIdToken)).resolves.toBeNull()
  })

  it('returns null when token signature length does not match expected length', async () => {
    const now = Math.floor(Date.now() / 1000)
    const token = buildSignedToken({
      iss: 'mpm-next',
      aud: 'mpm-next-app',
      iat: now,
      exp: now + 100,
      userId: 9,
      userTypeID: 1,
      isAdmin: true,
    })

    const [header, payload] = token.split('.')
    const shortSignatureToken = `${header}.${payload}.x`

    await expect(verifySessionToken(shortSignatureToken)).resolves.toBeNull()
  })

  it('supports legacy payloads without userType and coerces non-string profile fields to null', async () => {
    const now = Math.floor(Date.now() / 1000)
    const token = buildSignedToken({
      iss: 'mpm-next',
      aud: 'mpm-next-app',
      iat: now,
      exp: now + 100,
      userId: 15,
      userTypeID: USER_TYPES.METROLOGY_PROGRAMMER,
      isAdmin: false,
      employeeNumber: 123,
      networkUserName: true,
      displayName: ['bad'],
      fullName: { bad: true },
    })

    await expect(verifySessionToken(token)).resolves.toEqual({
      userId: 15,
      userTypeID: USER_TYPES.METROLOGY_PROGRAMMER,
      userType: USER_TYPES.METROLOGY_PROGRAMMER,
      isAdmin: false,
      employeeNumber: null,
      networkUserName: null,
      displayName: null,
      fullName: null,
    })
  })

  it('returns null for expired tokens', async () => {
    const now = Math.floor(Date.now() / 1000)
    const expiredToken = buildSignedToken({
      iss: 'mpm-next',
      aud: 'mpm-next-app',
      iat: now - 50,
      exp: now - 1,
      userId: 9,
      userTypeID: 1,
      isAdmin: true,
    })

    await expect(verifySessionToken(expiredToken)).resolves.toBeNull()
  })

  it('writes and clears the session cookie with expected options', async () => {
    const token = await setSessionCookie({
      userId: 5,
      userTypeID: 1,
      userType: USER_TYPES.METROLOGY_PROGRAMMER,
      isAdmin: true,
      employeeNumber: null,
      networkUserName: null,
      displayName: null,
      fullName: null,
    })

    expect(typeof token).toBe('string')
    expect(mockCookieSet).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      token,
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
      }),
    )

    await clearSessionCookie()
    expect(mockCookieDelete).toHaveBeenCalledWith(SESSION_COOKIE_NAME)
  })

  it('uses secure cookies in production', async () => {
    mutableEnv.NODE_ENV = 'production'

    const token = await setSessionCookie({
      userId: 5,
      userTypeID: 1,
      userType: USER_TYPES.METROLOGY_PROGRAMMER,
      isAdmin: true,
      employeeNumber: null,
      networkUserName: null,
      displayName: null,
      fullName: null,
    })

    expect(mockCookieSet).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      token,
      expect.objectContaining({ secure: true }),
    )
  })

  it('reads and verifies session user from cookie store', async () => {
    const token = await createSessionToken({
      userId: 22,
      userTypeID: 2,
      userType: USER_TYPES.METROLOGY_CALIBRATION_TECHNICIAN,
      isAdmin: false,
      employeeNumber: 'E22',
      networkUserName: 'u22',
      displayName: 'User 22',
      fullName: 'User Twenty Two',
    })
    mockCookieGet.mockReturnValueOnce({ value: token })

    await expect(getSessionUser()).resolves.toEqual(
      expect.objectContaining({
        userId: 22,
        userTypeID: 2,
      }),
    )
  })

  it('returns null when no session cookie exists', async () => {
    mockCookieGet.mockReturnValueOnce(undefined)

    await expect(getSessionUser()).resolves.toBeNull()
  })

  it('maps server user fields into session user shape', () => {
    const mapped = toSessionUser({
      ID: 7,
      UserTypeID: USER_TYPES.QUALITY_ENGINEER,
      IsAdmin: 1,
      EmployeeNumber: 'E7',
      NetworkUserName: 'user7',
      DisplayName: 'User Seven',
      FullName: 'User Seven Name',
    } as never)

    expect(mapped).toEqual({
      userId: 7,
      userTypeID: USER_TYPES.QUALITY_ENGINEER,
      userType: USER_TYPES.QUALITY_ENGINEER,
      isAdmin: false,
      employeeNumber: 'E7',
      networkUserName: 'user7',
      displayName: 'User Seven',
      fullName: 'User Seven Name',
    })
  })

  it('maps nullish server user profile fields to null values', () => {
    const mapped = toSessionUser({
      ID: 8,
      UserTypeID: null,
      IsAdmin: null,
      EmployeeNumber: undefined,
      NetworkUserName: undefined,
      DisplayName: undefined,
      FullName: undefined,
    } as never)

    expect(mapped).toEqual({
      userId: 8,
      userTypeID: null,
      userType: null,
      isAdmin: false,
      employeeNumber: null,
      networkUserName: null,
      displayName: null,
      fullName: null,
    })
  })

  it('throws when creating a token without JWT secret configured', async () => {
    const previousSecret = process.env.JWT_SECRET
    delete process.env.JWT_SECRET

    await expect(
      createSessionToken({
        userId: 1,
        userTypeID: null,
        userType: null,
        isAdmin: false,
        employeeNumber: null,
        networkUserName: null,
        displayName: null,
        fullName: null,
      }),
    ).rejects.toThrow('JWT_SECRET is not configured')

    process.env.JWT_SECRET = previousSecret
  })
})

