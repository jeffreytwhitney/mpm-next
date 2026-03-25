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
  getCellLeadDropdownOptions,
  getManufacturingEngineerDropdownOptions,
  getMetrologyProgrammerDropdownOptions,
  getMetrologyProgrammerUsers,
  getMetrologyUserDropdownOptions,
  getMetrologyUsers,
  getQualityEngineerDropdownOptions,
  getUserByEmployeeNumber,
  getUserById,
  getUsersByDepartmentAndUserTypeID,
  getUsersBySiteIDAndUserTypeID,
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

  it('queries users by site and user type ordered by full name', async () => {
    mockFindManyUser.mockResolvedValueOnce([])

    await getUsersBySiteIDAndUserTypeID(2, 3)

    expect(mockFindManyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          SiteID: 2,
          UserTypeID: 3,
        },
        orderBy: {
          FullName: 'asc',
        },
      }),
    )
  })

  it('maps metrology user dropdown options by display name and filters blank names', async () => {
    mockFindManyUser.mockResolvedValueOnce([
      { ID: 20, DisplayName: 'A. User' },
      { ID: 21, DisplayName: '' },
      { ID: 22, DisplayName: null },
    ])

    const result = await getMetrologyUserDropdownOptions(5)

    expect(mockFindManyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          SiteID: 5,
          IsActive: 1,
          UserTypeID: { in: [1, 2] },
        },
        orderBy: { DisplayName: 'asc' },
      }),
    )
    expect(result).toEqual([{ value: 20, label: 'A. User' }])
  })

  it('maps quality engineer dropdown options', async () => {
    mockFindManyUser.mockResolvedValueOnce([{ ID: 30, FullName: 'Quality Name' }])

    await expect(getQualityEngineerDropdownOptions(9)).resolves.toEqual([{ value: 30, label: 'Quality Name' }])

    expect(mockFindManyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          DepartmentID: 9,
          IsActive: 1,
          UserTypeID: 3,
        },
      }),
    )
  })

  it('maps manufacturing engineer dropdown options', async () => {
    mockFindManyUser.mockResolvedValueOnce([{ ID: 31, FullName: 'Manufacturing Name' }])

    await expect(getManufacturingEngineerDropdownOptions(11)).resolves.toEqual([{ value: 31, label: 'Manufacturing Name' }])

    expect(mockFindManyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          DepartmentID: 11,
          IsActive: 1,
          UserTypeID: 4,
        },
      }),
    )
  })

  it('maps cell lead dropdown options', async () => {
    mockFindManyUser.mockResolvedValueOnce([{ ID: 32, FullName: 'Cell Lead Name' }])

    await expect(getCellLeadDropdownOptions(12)).resolves.toEqual([{ value: 32, label: 'Cell Lead Name' }])

    expect(mockFindManyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          DepartmentID: 12,
          IsActive: 1,
          UserTypeID: 5,
        },
      }),
    )
  })

  it('throws a consistent error when user query fails', async () => {
    mockFindFirstUser.mockRejectedValueOnce(new Error('db fail'))

    await expect(getUserById(1)).rejects.toThrow('Failed to fetch user')
  })

  it('throws consistent errors for representative user query failures', async () => {
    mockFindFirstUser.mockRejectedValueOnce(new Error('db fail'))
    await expect(getUserByEmployeeNumber('E1')).rejects.toThrow('Failed to fetch user')

    mockFindFirstUser.mockRejectedValueOnce(new Error('db fail'))
    await expect(getActiveUserForAuth('E1')).rejects.toThrow('Failed to fetch user for auth')

    mockFindManyUser.mockRejectedValueOnce(new Error('db fail'))
    await expect(getMetrologyUsers(2)).rejects.toThrow('Failed to fetch user')

    mockFindManyUser.mockRejectedValueOnce(new Error('db fail'))
    await expect(getUsersByDepartmentAndUserTypeID(2, 3)).rejects.toThrow('Failed to fetch usersByDepartmentAndUserTypeID')

    mockFindManyUser.mockRejectedValueOnce(new Error('db fail'))
    await expect(getUsersBySiteIDAndUserTypeID(2, 3)).rejects.toThrow('Failed to fetch usersByDepartmentAndUserTypeID')

    mockFindManyUser.mockRejectedValueOnce(new Error('db fail'))
    await expect(getMetrologyProgrammerDropdownOptions()).rejects.toThrow('Failed to fetch user')

    mockFindManyUser.mockRejectedValueOnce(new Error('db fail'))
    await expect(getMetrologyUserDropdownOptions(1)).rejects.toThrow('Failed to fetch user')

    mockFindManyUser.mockRejectedValueOnce(new Error('db fail'))
    await expect(getQualityEngineerDropdownOptions(1)).rejects.toThrow('Failed to fetch user')

    mockFindManyUser.mockRejectedValueOnce(new Error('db fail'))
    await expect(getManufacturingEngineerDropdownOptions(1)).rejects.toThrow('Failed to fetch user')

    mockFindManyUser.mockRejectedValueOnce(new Error('db fail'))
    await expect(getCellLeadDropdownOptions(1)).rejects.toThrow('Failed to fetch user')
  })

})

