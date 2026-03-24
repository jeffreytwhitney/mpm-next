beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

const mockFindFirstUser = jest.fn()
const mockFindManyUser = jest.fn()
const mockVerifyPassword = jest.fn()

jest.mock('@/lib/hash', () => ({
  verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tblUser: {
      findFirst: mockFindFirstUser,
      findMany: mockFindManyUser,
    },
  },
}))

import {
  getActiveUserForAuth,
  getMetrologyProgrammerDropdownOptions,
  getMetrologyProgrammerUsers,
  getMetrologyUsers,
  getUserByEmployeeNumber,
  getUserById,
  getUsersByDepartmentAndUserTypeID,
  verifyUserCredentials,
} from '@/server/data/user'

describe('userActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('queries user by id', async () => {
    mockFindFirstUser.mockResolvedValueOnce({ ID: 8 })

    const result = await getUserById(8)

    expect(mockFindFirstUser).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ID: 8 } }),
    )
    expect(result).toEqual({ ID: 8 })
  })

  it('queries user by employee number', async () => {
    mockFindFirstUser.mockResolvedValueOnce({ ID: 11 })

    await getUserByEmployeeNumber('E123')

    expect(mockFindFirstUser).toHaveBeenCalledWith(
      expect.objectContaining({ where: { EmployeeNumber: 'E123' } }),
    )
  })

  it('queries active user for auth by employee number or network username and includes password', async () => {
    mockFindFirstUser.mockResolvedValueOnce({ ID: 11, Password: 'hash' })

    await getActiveUserForAuth('E123')

    expect(mockFindFirstUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          IsActive: 1,
          OR: [
            { EmployeeNumber: 'E123' },
            { NetworkUserName: 'E123' },
          ],
        },
        select: expect.objectContaining({ Password: true }),
      }),
    )
  })

  it('returns null for blank auth identifiers', async () => {
    await expect(getActiveUserForAuth('   ')).resolves.toBeNull()
    expect(mockFindFirstUser).not.toHaveBeenCalled()
  })

  it('verifies credentials and returns a safe user without password', async () => {
    mockFindFirstUser.mockResolvedValueOnce({
      ID: 11,
      EmployeeNumber: 'E123',
      NetworkUserName: 'jdoe',
      Password: '$2b$12$hash',
    })
    mockVerifyPassword.mockResolvedValueOnce(true)

    const result = await verifyUserCredentials('E123', 'Aw3s0me5auc3')

    expect(mockVerifyPassword).toHaveBeenCalledWith('Aw3s0me5auc3', '$2b$12$hash')
    expect(result).toEqual({
      ID: 11,
      EmployeeNumber: 'E123',
      NetworkUserName: 'jdoe',
    })
    expect(result).not.toHaveProperty('Password')
  })

  it('returns null when auth user has no stored password', async () => {
    mockFindFirstUser.mockResolvedValueOnce({ ID: 11, Password: null })

    await expect(verifyUserCredentials('E123', 'Aw3s0me5auc3')).resolves.toBeNull()
    expect(mockVerifyPassword).not.toHaveBeenCalled()
  })

  it('returns null when password verification fails', async () => {
    mockFindFirstUser.mockResolvedValueOnce({ ID: 11, Password: '$2b$12$hash' })
    mockVerifyPassword.mockResolvedValueOnce(false)

    await expect(verifyUserCredentials('E123', 'wrong-password')).resolves.toBeNull()
  })

  it('filters metrology programmer users by site and user type 1', async () => {
    mockFindManyUser.mockResolvedValueOnce([])

    await getMetrologyProgrammerUsers(2)

    expect(mockFindManyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          SiteID: 2,
          IsActive: 1,
          UserTypeID: 1,
        },
      }),
    )
  })

  it('loads metrology programmer dropdown options from all configured sites', async () => {
    mockFindManyUser.mockResolvedValueOnce([
      { ID: 10, FullName: 'Alex Programmer' },
      { ID: 11, FullName: null },
    ])

    const result = await getMetrologyProgrammerDropdownOptions()

    expect(mockFindManyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          SiteID: { in: [1, 2] },
          IsActive: 1,
          UserTypeID: 1,
        },
        orderBy: {
          FullName: 'asc',
        },
      }),
    )
    expect(result).toEqual([{ value: 10, label: 'Alex Programmer' }])
  })

  it('filters metrology users by user types 1 and 2', async () => {
    mockFindManyUser.mockResolvedValueOnce([])

    await getMetrologyUsers(5)

    expect(mockFindManyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          SiteID: 5,
          IsActive: 1,
          UserTypeID: { in: [1, 2] },
        },
      }),
    )
  })

  it('queries users by department and user type', async () => {
    mockFindManyUser.mockResolvedValueOnce([])

    await getUsersByDepartmentAndUserTypeID(12, 2)

    expect(mockFindManyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          DepartmentID: 12,
          UserTypeID: 2,
        },
      }),
    )
  })

  it('throws a consistent error when user query fails', async () => {
    mockFindFirstUser.mockRejectedValueOnce(new Error('db fail'))

    await expect(getUserById(1)).rejects.toThrow('Failed to fetch user')
  })

})

