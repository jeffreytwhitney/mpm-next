const mockFindFirstUser = jest.fn()
const mockFindManyUser = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tblUser: {
      findFirst: mockFindFirstUser,
      findMany: mockFindManyUser,
    },
  },
}))

import {
  getMetrologyProgrammerUsers,
  getMetrologyUsers,
  getUserByEmployeeNumber,
  getUserById,
  getUsersByDepartmentAndUserTypeID,
} from '@/app/actions/userActions'

describe('userActions', () => {
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

