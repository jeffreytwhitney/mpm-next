jest.mock('@/lib/prisma', () => ({
  prisma: {
    qryTaskListRaw: {
      findMany: jest.fn(),
    },
    tblTask: {
      findFirst: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { getTaskList } from '@/app/actions/taskListActions'
import { getTaskById } from '@/app/actions/taskActions'

const mockFindManyTaskList = prisma.qryTaskListRaw.findMany as jest.Mock
const mockFindFirstTask = prisma.tblTask.findFirst as jest.Mock

describe('taskListActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('builds default query for getTaskList', async () => {
    mockFindManyTaskList.mockResolvedValueOnce([])

    await getTaskList()

    expect(mockFindManyTaskList).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ StatusID: { lt: 4 } }),
        orderBy: { DueDate: 'asc' },
        take: 50,
        skip: 0,
      }),
    )
  })

  it('applies explicit filters and paging for getTaskList', async () => {
    mockFindManyTaskList.mockResolvedValueOnce([])

    await getTaskList({
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

  it('throws a consistent error when getTaskList fails', async () => {
    mockFindManyTaskList.mockRejectedValueOnce(new Error('db fail'))

    await expect(getTaskList()).rejects.toThrow('Failed to fetch tasks')
  })


  it('filters to unassigned tasks when unassigned preset is active', async () => {
    mockFindManyTaskList.mockResolvedValueOnce([])

    await getTaskList({ unassignedPreset: 'unAssigned' })

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

    await getTaskList({ unassignedPreset: 'unAssigned', assignedToID: 7 })

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

    await getTaskList({ statusID: 2 })

    const args = mockFindManyTaskList.mock.calls[0][0]
    expect(args.where).not.toHaveProperty('AssignedToID')
  })

  it('queries task by id in getTaskById', async () => {
    mockFindFirstTask.mockResolvedValueOnce({ ID: 99 })

    const result = await getTaskById(99)

    expect(mockFindFirstTask).toHaveBeenCalledWith({ where: { ID: 99 } })
    expect(result).toEqual({ ID: 99 })
  })
})

