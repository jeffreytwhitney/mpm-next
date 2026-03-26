/**
 * Password Hashing Utility Module
 *
 * Provides cryptographic password handling including:
 * - Secure password hashing using bcryptjs with configurable rounds
 * - Safe password verification against stored hashes
 *
 * Uses 12 rounds by default for adequate security without excessive computational cost.
 */
import { compare, hash } from 'bcryptjs'

const DEFAULT_PASSWORD_ROUNDS = 12

export async function hashPassword(password: string, rounds = DEFAULT_PASSWORD_ROUNDS): Promise<string> {
  return hash(password, rounds)
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash)
}

