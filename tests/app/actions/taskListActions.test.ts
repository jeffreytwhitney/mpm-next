const mockFindManyTaskList = jest.fn()
const mockFindFirstTask = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    qryTaskList: {
      findMany: mockFindManyTaskList,
    },
    tblTask: {
      findFirst: mockFindFirstTask,
    },
  },
}))

import { getTaskById, getTaskList } from '@/app/actions/taskListActions'

describe('taskListActions', () => {
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

  it('queries task by id in getTaskById', async () => {
    mockFindFirstTask.mockResolvedValueOnce({ ID: 99 })

    const result = await getTaskById(99)

    expect(mockFindFirstTask).toHaveBeenCalledWith({ where: { ID: 99 } })
    expect(result).toEqual({ ID: 99 })
  })
})

