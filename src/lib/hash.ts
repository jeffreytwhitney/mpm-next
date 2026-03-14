import { compare, hash } from 'bcryptjs'

const DEFAULT_PASSWORD_ROUNDS = 12

export async function hashPassword(password: string, rounds = DEFAULT_PASSWORD_ROUNDS): Promise<string> {
  return hash(password, rounds)
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash)
}

