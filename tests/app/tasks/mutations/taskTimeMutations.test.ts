const mockCreateTaskTimeEntry = jest.fn()
const mockStartOfDay = jest.fn()

jest.mock('@/server/data/taskTime', () => ({
  createTaskTimeEntry: (...args: unknown[]) => mockCreateTaskTimeEntry(...args),
}))

jest.mock('@/lib/date', () => ({
  startOfDay: (...args: unknown[]) => mockStartOfDay(...args),
}))

import { addTaskTimeEntry } from '@/features/tasks/mutations/taskTimeMutations'

describe('taskTimeMutations.addTaskTimeEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('throws when hours are not greater than zero', async () => {
    await expect(
      addTaskTimeEntry({
        taskId: 1,
        assigneeId: 2,
        entryDate: new Date('2026-03-01T10:45:00.000Z'),
        hours: 0,
      }),
    ).rejects.toThrow('Hours must be greater than 0.')

    expect(mockCreateTaskTimeEntry).not.toHaveBeenCalled()
    expect(mockStartOfDay).not.toHaveBeenCalled()
  })

  it('normalizes the entry date and forwards payload to data access', async () => {
    const entryDate = new Date('2026-03-01T10:45:00.000Z')
    const normalizedDate = new Date('2026-03-01T00:00:00.000Z')
    const dbResult = { ID: 99 }

    mockStartOfDay.mockReturnValueOnce(normalizedDate)
    mockCreateTaskTimeEntry.mockResolvedValueOnce(dbResult)

    await expect(
      addTaskTimeEntry({
        taskId: 15,
        assigneeId: 7,
        entryDate,
        hours: 2.5,
      }),
    ).resolves.toEqual(dbResult)

    expect(mockStartOfDay).toHaveBeenCalledWith(entryDate)
    expect(mockCreateTaskTimeEntry).toHaveBeenCalledWith({
      TaskID: 15,
      AssignedToID: 7,
      EntryDate: normalizedDate,
      Hours: 2.5,
    })
  })
})

