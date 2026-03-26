beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

const mockFindFirst = jest.fn()
const mockFindMany = jest.fn()
const mockCreate = jest.fn()
const mockUpdate = jest.fn()
const mockCount = jest.fn()
const mockUpdateTicket = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tblTask: {
      findFirst: mockFindFirst,
      findMany: mockFindMany,
      create: mockCreate,
      update: mockUpdate,
      count: mockCount,
    },
  },
}))

jest.mock('@/server/data/ticket', () => ({
  updateTicket: (...args: unknown[]) => mockUpdateTicket(...args),
}))

import { Prisma } from '@/generated/prisma/client'
import {
  checkExistingTask,
  countActiveTasksByProjectId,
  createTask,
  getTaskById,
  getTasksByProjectId,
  updateTask,
} from '@/server/data/task'

describe('checkExistingTask (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns true when a task exists with matching taskName, operation, taskTypeID, and manufacturingRev', async () => {
    mockFindMany.mockResolvedValueOnce([{ TaskName: 'Task ABC' }])

    const result = await checkExistingTask('Task ABC', 'OP-001', 5, 'B', 100)

    expect(mockFindMany).toHaveBeenCalledWith({
      select: { TaskName: true },
      where: {
        Operation: 'OP-001',
        TaskTypeID: 5,
        ManufacturingRev: 'B',
        ProjectID: 100,
      },
    })
    expect(result).toBe(true)
  })

  it('returns false when no task exists with the given criteria', async () => {
    mockFindMany.mockResolvedValueOnce([])

    const result = await checkExistingTask('Task XYZ', 'OP-999', 10, 'C', 200)

    expect(mockFindMany).toHaveBeenCalledWith({
      select: { TaskName: true },
      where: {
        Operation: 'OP-999',
        TaskTypeID: 10,
        ManufacturingRev: 'C',
        ProjectID: 200,
      },
    })
    expect(result).toBe(false)
  })

  it('passes the exact string values to the query without transformation', async () => {
    mockFindMany.mockResolvedValueOnce([])

    await checkExistingTask('Task With Spaces', 'OP-123', 3, 'REV-1', 50)

    const callArgs = mockFindMany.mock.calls[0][0]
    expect(callArgs.where.Operation).toBe('OP-123')
    expect(callArgs.where.TaskTypeID).toBe(3)
    expect(callArgs.where.ManufacturingRev).toBe('REV-1')
    expect(callArgs.where.ProjectID).toBe(50)
  })

  it('throws an error when the database query fails', async () => {
    mockFindMany.mockRejectedValueOnce(new Error('Database connection failed'))

    await expect(checkExistingTask('Task ABC', 'OP-001', 5, 'B', 100)).rejects.toThrow(
      'Database connection failed',
    )
  })

  it('handles null or undefined task names', async () => {
    mockFindMany.mockResolvedValueOnce([])

    // Testing with empty string
    const result = await checkExistingTask('', 'OP-001', 5, 'B', 100)

    expect(mockFindMany).toHaveBeenCalled()
    expect(result).toBe(false)
  })

  it('matches taskName case-insensitively', async () => {
    mockFindMany.mockResolvedValueOnce([{ TaskName: 'TaSk AbC' }])

    const result = await checkExistingTask('task abc', 'OP-001', 5, 'B', 100)

    expect(result).toBe(true)
  })
})

describe('task data access wrappers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('gets a task by id with the expected query shape', async () => {
    mockFindFirst.mockResolvedValueOnce({ ID: 7 })

    await expect(getTaskById(7)).resolves.toEqual({ ID: 7 })
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ID: 7 },
      }),
    )
  })

  it('surfaces a user-friendly error when getTaskById fails', async () => {
    mockFindFirst.mockRejectedValueOnce(new Error('db down'))

    await expect(getTaskById(3)).rejects.toThrow('Failed to fetch task')
  })

  it('gets tasks by project id', async () => {
    mockFindMany.mockResolvedValueOnce([{ ID: 1 }, { ID: 2 }])

    await expect(getTasksByProjectId(55)).resolves.toEqual([{ ID: 1 }, { ID: 2 }])
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ProjectID: 55 },
      }),
    )
  })

  it('creates a task, defaults CurrentlyRunning, and updates active task count on ticket', async () => {
    mockCreate.mockResolvedValueOnce({ ID: 100 })
    mockCount.mockResolvedValueOnce(8)

    await expect(
      createTask({
        ProjectID: 10,
        StatusID: 1,
        TaskName: 'New Task',
        Operation: '20',
      }),
    ).resolves.toEqual({ ID: 100 })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ProjectID: 10,
          StatusID: 1,
          TaskName: 'New Task',
          Operation: '20',
          CurrentlyRunning: 0,
          CreatedTimestamp: expect.any(Date),
          UpdatedTimestamp: expect.any(Date),
        }),
      }),
    )

    expect(mockCount).toHaveBeenCalledWith({
      where: {
        ProjectID: 10,
        StatusID: { notIn: [4, 5] },
      },
    })

    expect(mockUpdateTicket).toHaveBeenCalledWith(10, { CountOfActiveTasks: 8 })
  })

  it('returns null when updateTask hits Prisma P2025', async () => {
    mockUpdate.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: 'test-client',
      }),
    )

    await expect(updateTask(88, { TaskName: 'x' })).resolves.toBeNull()
  })

  it('rethrows updateTask errors for non-P2025 failures', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('unexpected'))

    await expect(updateTask(88, { TaskName: 'x' })).rejects.toThrow('unexpected')
  })

  it('counts active tasks by project id', async () => {
    mockCount.mockResolvedValueOnce(3)

    await expect(countActiveTasksByProjectId(42)).resolves.toBe(3)
    expect(mockCount).toHaveBeenCalledWith({
      where: {
        ProjectID: 42,
        StatusID: { notIn: [4, 5] },
      },
    })
  })
})

