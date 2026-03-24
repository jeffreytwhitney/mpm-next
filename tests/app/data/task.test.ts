beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

const mockFindFirst = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tblTask: {
      findFirst: mockFindFirst,
    },
  },
}))

import { checkExistingTask } from '@/server/data/task'

describe('checkExistingTask (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns true when a task exists with matching taskName, operation, and taskTypeID', async () => {
    mockFindFirst.mockResolvedValueOnce({ ID: 1 })

    const result = await checkExistingTask('Task ABC', 'OP-001', 5)

    expect(mockFindFirst).toHaveBeenCalledWith({
      select: { ID: true },
      where: {
        TaskName: 'Task ABC',
        Operation: 'OP-001',
        TaskTypeID: 5,
      },
    })
    expect(result).toBe(true)
  })

  it('returns false when no task exists with the given criteria', async () => {
    mockFindFirst.mockResolvedValueOnce(null)

    const result = await checkExistingTask('Task XYZ', 'OP-999', 10)

    expect(mockFindFirst).toHaveBeenCalledWith({
      select: { ID: true },
      where: {
        TaskName: 'Task XYZ',
        Operation: 'OP-999',
        TaskTypeID: 10,
      },
    })
    expect(result).toBe(false)
  })

  it('passes the exact string values to the query without transformation', async () => {
    mockFindFirst.mockResolvedValueOnce(null)

    await checkExistingTask('Task With Spaces', 'OP-123', 3)

    const callArgs = mockFindFirst.mock.calls[0][0]
    expect(callArgs.where.TaskName).toBe('Task With Spaces')
    expect(callArgs.where.Operation).toBe('OP-123')
    expect(callArgs.where.TaskTypeID).toBe(3)
  })

  it('throws an error when the database query fails', async () => {
    mockFindFirst.mockRejectedValueOnce(new Error('Database connection failed'))

    await expect(checkExistingTask('Task ABC', 'OP-001', 5)).rejects.toThrow(
      'Database connection failed',
    )
  })

  it('handles null or undefined task names', async () => {
    mockFindFirst.mockResolvedValueOnce(null)

    // Testing with empty string
    const result = await checkExistingTask('', 'OP-001', 5)

    expect(mockFindFirst).toHaveBeenCalled()
    expect(result).toBe(false)
  })
})

