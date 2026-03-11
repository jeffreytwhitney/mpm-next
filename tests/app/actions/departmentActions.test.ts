const mockFindManyDepartment = jest.fn()
const mockFindFirstDepartment = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tblDepartment: {
      findMany: mockFindManyDepartment,
      findFirst: mockFindFirstDepartment,
    },
  },
}))

import { getDepartmentById, getDepartments } from '@/app/actions/departmentActions'

describe('departmentActions', () => {
  it('queries departments by site id ordered by name', async () => {
    mockFindManyDepartment.mockResolvedValueOnce([])

    await getDepartments(7)

    expect(mockFindManyDepartment).toHaveBeenCalledWith({
      select: {
        ID: true,
        SiteID: true,
        DepartmentName: true,
      },
      where: { SiteID: 7 },
      orderBy: { DepartmentName: 'asc' },
    })
  })

  it('throws a consistent error when getDepartments fails', async () => {
    mockFindManyDepartment.mockRejectedValueOnce(new Error('db fail'))

    await expect(getDepartments(1)).rejects.toThrow('Failed to fetch Departments')
  })

  it('queries a single department by id', async () => {
    mockFindFirstDepartment.mockResolvedValueOnce({ ID: 3 })

    const result = await getDepartmentById(3)

    expect(mockFindFirstDepartment).toHaveBeenCalledWith({ where: { ID: 3 } })
    expect(result).toEqual({ ID: 3 })
  })
})

