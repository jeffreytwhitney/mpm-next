jest.mock('@/lib/prisma', () => ({
  prisma: {
    qryProjectList: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    tblTask: {
      findMany: jest.fn(),
    },
  },
}))

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

import {prisma} from '@/lib/prisma'
import {getTicketList, parseTicketListFilters} from '@/server/data/ticketList'

const mockFindManyTicketList = prisma.qryProjectList.findMany as jest.Mock
const mockCountTicketList = prisma.qryProjectList.count as jest.Mock
const mockFindManyTasks = prisma.tblTask.findMany as jest.Mock

describe('ticketListActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindManyTicketList.mockResolvedValue([])
    mockCountTicketList.mockResolvedValue(0)
    mockFindManyTasks.mockResolvedValue([])
  })

  it('builds the default query for getTicketList', async () => {
    await getTicketList()

    expect(mockFindManyTasks).not.toHaveBeenCalled()
    expect(mockFindManyTicketList).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({SiteID: 1}),
        orderBy: {TicketNumber: 'asc'},
        take: 25,
        skip: 0,
      }),
    )
  })

  it('applies standard ticket filters and paging', async () => {
    await getTicketList({
      siteID: '2',
      ticketNumber: 'TK-100',
      ticketName: 'Fixture',
      departmentID: 5,
      qualityEngineerID: 7,
      submittorID: 8,
      sortBy: 'ProjectName',
      sortOrder: 'desc',
      page: 2,
      pageSize: 10,
    })

    expect(mockFindManyTicketList).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          SiteID: 2,
          TicketNumber: {contains: 'TK-100'},
          ProjectName: {contains: 'Fixture'},
          DepartmentID: 5,
          SecondaryProjectOwnerID: 7,
          InitiatorEmployeeID: 8,
        }),
        orderBy: {ProjectName: 'desc'},
        take: 10,
        skip: 10,
      }),
    )
  })

  it('uses a task-name subquery and filters tickets by matching ProjectIDs', async () => {
    mockFindManyTasks.mockResolvedValueOnce([{ProjectID: 11}, {ProjectID: 12}])

    await getTicketList({
      siteID: '3',
      taskName: 'inspection',
    })

    expect(mockFindManyTasks).toHaveBeenCalledWith({
      where: {
        TaskName: {contains: 'inspection'},
        Project: {
          SiteID: 3,
          CountOfActiveTasks: {gt: 1},
        },
      },
      select: {ProjectID: true},
      distinct: ['ProjectID'],
    })

    expect(mockFindManyTicketList).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          SiteID: 3,
          ID: {in: [11, 12]},
        }),
      }),
    )
  })

  it('returns empty results when task-name subquery has no project matches', async () => {
    mockFindManyTasks.mockResolvedValueOnce([])

    const result = await getTicketList({
      siteID: '1',
      taskName: 'does-not-exist',
    })

    expect(result).toEqual({tasks: [], totalCount: 0})
    expect(mockFindManyTicketList).not.toHaveBeenCalled()
    expect(mockCountTicketList).not.toHaveBeenCalled()
  })

  it('throws a consistent error when getTicketList fails', async () => {
    mockFindManyTicketList.mockRejectedValueOnce(new Error('db fail'))

    await expect(getTicketList()).rejects.toThrow('Failed to fetch tickets')
  })

  it('uses provided default site when siteID query param is missing', () => {
    const filters = parseTicketListFilters({}, '2')

    expect(filters.siteID).toBe('2')
  })

  it('prefers URL siteID over default site when provided', () => {
    const filters = parseTicketListFilters({siteID: '1'})

    expect(filters.siteID).toBe('1')
  })
})

