beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

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

import {
  getDepartmentById,
  getDepartments,
  getTopLevelDepartmentDropdownOptions,
} from '@/server/data/department'

describe('departmentActions', () => {
  beforeEach(() => {
    mockFindManyDepartment.mockReset()
    mockFindFirstDepartment.mockReset()
  })

  it('queries departments by site id ordered by name', async () => {
    mockFindManyDepartment.mockResolvedValueOnce([])

    await getDepartments(7)

    expect(mockFindManyDepartment).toHaveBeenCalledWith({
      select: {
        CMMFilePath: true,
        CellLeadCCList: true,
        CreatedTimestamp: true,
        ID: true,
        SiteID: true,
        DepartmentName: true,
        ManufacturingCCList: true,
        ParentID: true,
        QualityCCList: true,
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

    expect(mockFindFirstDepartment).toHaveBeenCalledWith({
      select: {
        CMMFilePath: true,
        CellLeadCCList: true,
        CreatedTimestamp: true,
        DepartmentName: true,
        ID: true,
        ManufacturingCCList: true,
        ParentID: true,
        QualityCCList: true,
        SiteID: true,
      },
      where: { ID: 3 },
    })
    expect(result).toEqual({ ID: 3 })
  })

  it('queries top-level department dropdown options by site id', async () => {
    mockFindManyDepartment.mockResolvedValueOnce([{ ID: 4, DepartmentName: 'Quality' }])

    const result = await getTopLevelDepartmentDropdownOptions(9)

    expect(mockFindManyDepartment).toHaveBeenCalledWith({
      select: {
        ID: true,
        DepartmentName: true,
      },
      where: {
        SiteID: 9,
        ParentID: null,
      },
      orderBy: { DepartmentName: 'asc' },
    })
    expect(result).toEqual([{ value: 4, label: 'Quality' }])
  })
})

