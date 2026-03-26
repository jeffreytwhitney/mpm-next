/**
 * Session Management Module
 *
 * Handles HTTP-only cookie-based session tokens including:
 * - Session token creation with JWT claims (issuer, audience, expiration)
 * - Session token validation and decoding
 * - Cookie persistence and clearing
 * - Session user extraction from request cookies
 *
 * Uses HTTP-only, Lax SameSite cookies for security and 7-day expiration.
 * Session tokens are JWTs containing user info for efficient lookups without additional DB queries.
 */
import crypto from 'crypto'
import { cookies } from 'next/headers'
import type { MPMUser } from '@/server/data/user'
import { isEffectiveAdmin, toKnownUserTypeID, type KnownUserTypeID } from '@/lib/auth/roles'

export const SESSION_COOKIE_NAME = 'mpm_session'
const SESSION_ISSUER = 'mpm-next'
const SESSION_AUDIENCE = 'mpm-next-app'
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7

export interface SessionUser {
  userId: number
  userTypeID: number | null
  userType: KnownUserTypeID | null
  isAdmin: boolean
  employeeNumber: string | null
  networkUserName: string | null
  displayName: string | null
  fullName: string | null
}

interface SessionTokenClaims extends SessionUser {
  iss: string
  aud: string
  iat: number
  exp: number
}

function getSessionSecret(): string {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is not configured')
  }

  return secret
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function signToken(unsignedToken: string): string {
  return crypto.createHmac('sha256', getSessionSecret()).update(unsignedToken).digest('base64url')
}

export function toSessionUser(user: MPMUser): SessionUser {
  return {
    userId: user.ID,
    userTypeID: user.UserTypeID ?? null,
    userType: toKnownUserTypeID(user.UserTypeID),
    isAdmin: isEffectiveAdmin({ UserTypeID: user.UserTypeID ?? null, IsAdmin: user.IsAdmin ?? null }),
    employeeNumber: user.EmployeeNumber ?? null,
    networkUserName: user.NetworkUserName ?? null,
    displayName: user.DisplayName ?? null,
    fullName: user.FullName ?? null,
  }
}

export async function createSessionToken(sessionUser: SessionUser): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000)
  const sessionClaims: SessionTokenClaims = {
    ...sessionUser,
    iss: SESSION_ISSUER,
    aud: SESSION_AUDIENCE,
    iat: issuedAt,
    exp: issuedAt + SESSION_DURATION_SECONDS,
  }

  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = encodeBase64Url(JSON.stringify(sessionClaims))
  const unsignedToken = `${header}.${payload}`
  const signature = signToken(unsignedToken)

  return `${unsignedToken}.${signature}`
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const [header, payload, signature] = token.split('.')

    if (!header || !payload || !signature) {
      return null
    }

    const unsignedToken = `${header}.${payload}`
    const expectedSignature = signToken(unsignedToken)

    if (signature.length !== expectedSignature.length) {
      return null
    }

    const isValidSignature = crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8'),
    )

    if (!isValidSignature) {
      return null
    }

    const parsedPayload = JSON.parse(decodeBase64Url(payload)) as Partial<SessionTokenClaims>

    if (
      parsedPayload.iss !== SESSION_ISSUER ||
      parsedPayload.aud !== SESSION_AUDIENCE ||
      typeof parsedPayload.exp !== 'number' ||
      parsedPayload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null
    }

    if (typeof parsedPayload.userId !== 'number') {
      return null
    }

    const userTypeID = typeof parsedPayload.userTypeID === 'number' ? parsedPayload.userTypeID : null
    // Backward compatibility: older tokens may not include userType.
    const userType = toKnownUserTypeID(typeof parsedPayload.userType === 'number' ? parsedPayload.userType : userTypeID)

    return {
      userId: parsedPayload.userId,
      userTypeID,
      userType,
      isAdmin: parsedPayload.isAdmin === true,
      employeeNumber: typeof parsedPayload.employeeNumber === 'string' ? parsedPayload.employeeNumber : null,
      networkUserName: typeof parsedPayload.networkUserName === 'string' ? parsedPayload.networkUserName : null,
      displayName: typeof parsedPayload.displayName === 'string' ? parsedPayload.displayName : null,
      fullName: typeof parsedPayload.fullName === 'string' ? parsedPayload.fullName : null,
    }
  } catch {
    return null
  }
}

export async function setSessionCookie(sessionUser: SessionUser): Promise<string> {
  const token = await createSessionToken(sessionUser)
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  })

  return token
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  return verifySessionToken(token)
}

