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
  getDepartmentDropdownOptions,
  getDepartments,
  getTopLevelDepartments,
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

  it('queries top-level departments by site and parent null', async () => {
    mockFindManyDepartment.mockResolvedValueOnce([])

    await getTopLevelDepartments(3)

    expect(mockFindManyDepartment).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          SiteID: 3,
          ParentID: null,
        },
      }),
    )
  })

  it('maps department dropdown options and filters blank department names', async () => {
    mockFindManyDepartment.mockResolvedValueOnce([
      { ID: 1, DepartmentName: 'Metrology' },
      { ID: 2, DepartmentName: '' },
      { ID: 3, DepartmentName: null },
    ])

    await expect(getDepartmentDropdownOptions(2)).resolves.toEqual([{ value: 1, label: 'Metrology' }])

    expect(mockFindManyDepartment).toHaveBeenCalledWith({
      select: {
        ID: true,
        DepartmentName: true,
      },
      where: {
        SiteID: 2,
      },
      orderBy: {
        DepartmentName: 'asc',
      },
    })
  })

  it('throws consistent errors for top-level and dropdown queries', async () => {
    mockFindManyDepartment.mockRejectedValueOnce(new Error('db fail'))
    await expect(getTopLevelDepartments(1)).rejects.toThrow('Failed to fetch Departments')

    mockFindManyDepartment.mockRejectedValueOnce(new Error('db fail'))
    await expect(getDepartmentDropdownOptions(1)).rejects.toThrow('Failed to fetch department options')

    mockFindManyDepartment.mockRejectedValueOnce(new Error('db fail'))
    await expect(getTopLevelDepartmentDropdownOptions(1)).rejects.toThrow('Failed to fetch top-level department options')
  })
})

