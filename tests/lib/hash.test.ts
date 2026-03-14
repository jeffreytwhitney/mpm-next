import { hashPassword, verifyPassword } from '@/lib/hash'

describe('password hashing utilities', () => {
  it('hashes a password with bcrypt', async () => {
    const passwordHash = await hashPassword('Aw3s0me5auc3', 4)

    expect(passwordHash).toMatch(/^\$2[aby]\$/)
    expect(passwordHash).not.toBe('Aw3s0me5auc3')
  })

  it('verifies a valid password', async () => {
    const passwordHash = await hashPassword('Aw3s0me5auc3', 4)

    await expect(verifyPassword('Aw3s0me5auc3', passwordHash)).resolves.toBe(true)
  })

  it('rejects an invalid password', async () => {
    const passwordHash = await hashPassword('Aw3s0me5auc3', 4)

    await expect(verifyPassword('wrong-password', passwordHash)).resolves.toBe(false)
  })
})

