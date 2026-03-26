jest.mock('@/lib/prisma', () => ({
  prisma: {
    qryTaskListRaw: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

import { prisma } from '@/lib/prisma'
import { getTaskList, getTaskListByProjectID, parseTaskListFilters } from '@/server/data/queries/taskList'

const mockFindManyTaskList = prisma.qryTaskListRaw.findMany as jest.Mock
const mockCountTaskList = prisma.qryTaskListRaw.count as jest.Mock

describe('taskListActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCountTaskList.mockResolvedValue(0)
  })

  it('builds default query for getTaskList', async () => {
    mockFindManyTaskList.mockResolvedValueOnce([])

    await getTaskList()

    expect(mockFindManyTaskList).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ StatusID: { lt: 4 } }),
        orderBy: { DueDate: 'asc' },
        take: 25,
        skip: 0,
      }),
    )

    const args = mockFindManyTaskList.mock.calls[0][0]
    expect(args.where).toMatchObject({ SiteID: 1 })
  })

  it('applies explicit filters and paging for getTaskList', async () => {
    mockFindManyTaskList.mockResolvedValueOnce([])

    await getTaskList({
      siteID: '2',
      statusID: 2,
      sortBy: 'TaskName',
      sortOrder: 'desc',
      page: 2,
      pageSize: 25,
      ticketNumber: 'T-100',
      assignedToID: 7,
      departmentID: 5,
    })

    expect(mockFindManyTaskList).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          SiteID: 2,
          StatusID: 2,
          TicketNumber: { contains: 'T-100' },
          AssignedToID: 7,
          DepartmentID: 5,
        }),
        orderBy: { TaskName: 'desc' },
        take: 25,
        skip: 25,
      }),
    )
  })

  it('sorts by AssignedToName when table column id is used', async () => {
    mockFindManyTaskList.mockResolvedValueOnce([])

    await getTaskList({
      siteID: '1',
      sortBy: 'AssignedToName',
      sortOrder: 'asc',
    })

    expect(mockFindManyTaskList).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { AssignedToName: 'asc' },
      }),
    )
  })

  it('throws a consistent error when getTaskList fails', async () => {
    mockFindManyTaskList.mockRejectedValueOnce(new Error('db fail'))

    await expect(getTaskList()).rejects.toThrow('Failed to fetch tasks')
  })

  it('returns all project tasks when no completion filter is provided', async () => {
    mockFindManyTaskList.mockResolvedValueOnce([])

    await getTaskListByProjectID(44)

    expect(mockFindManyTaskList).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ProjectID: 44,
        }),
        orderBy: { DueDate: 'asc' },
      }),
    )

    const args = mockFindManyTaskList.mock.calls[0][0]
    expect(args.where).not.toHaveProperty('StatusID')
  })

  it('filters project tasks to completed items when requested', async () => {
    mockFindManyTaskList.mockResolvedValueOnce([])

    await getTaskListByProjectID(44, { showCompleted: true })

    expect(mockFindManyTaskList).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ProjectID: 44,
          StatusID: { in: [4, 5] },
        }),
      }),
    )
  })


  it('filters to unassigned tasks when unassigned preset is active', async () => {
    mockFindManyTaskList.mockResolvedValueOnce([])

    await getTaskList({ siteID: '1', unassignedPreset: 'unAssigned' })

    expect(mockFindManyTaskList).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AssignedToID: null,
        }),
      }),
    )
  })

  it('prefers unassigned preset over assignedToID when both are provided', async () => {
    mockFindManyTaskList.mockResolvedValueOnce([])

    await getTaskList({ siteID: '1', unassignedPreset: 'unAssigned', assignedToID: 7 })

    expect(mockFindManyTaskList).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AssignedToID: null,
        }),
      }),
    )
  })

  it('does not include AssignedToID filter when assignee filters are not provided', async () => {
    mockFindManyTaskList.mockResolvedValueOnce([])

    await getTaskList({ siteID: '1', statusID: 2 })

    const args = mockFindManyTaskList.mock.calls[0][0]
    expect(args.where).not.toHaveProperty('AssignedToID')
  })


  it('uses provided default site when siteID query param is missing', () => {
    const filters = parseTaskListFilters({}, '2')

    expect(filters.siteID).toBe('2')
  })

  it('prefers URL siteID over default site when provided', () => {
    const filters = parseTaskListFilters({ siteID: '1' })

    expect(filters.siteID).toBe('1')
  })
})

