jest.mock('@/lib/prisma', () => ({
  prisma: {
    tblTaskTimeEntry: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
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
import {
  createTaskTimeEntry,
  getTaskTimeEntryByDateAndAssigneeId,
  getTaskTimeEntriesByTaskIDAndAssigneeID,
  getSumOfHoursByTaskID,
  getSumOfHoursByTaskIDAndAssigneeID,
} from '@/server/data/taskTime'

const mockFindFirst = prisma.tblTaskTimeEntry.findFirst as jest.Mock
const mockFindMany = prisma.tblTaskTimeEntry.findMany as jest.Mock
const mockAggregate = prisma.tblTaskTimeEntry.aggregate as jest.Mock
const mockCreate = prisma.tblTaskTimeEntry.create as jest.Mock
const mockUpdate = prisma.tblTaskTimeEntry.update as jest.Mock

const FIXED_NOW = new Date('2026-03-18T00:00:00.000Z')

describe('taskTime data access', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(FIXED_NOW)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  // ---------------------------------------------------------------------------
  // getTaskTimeEntryByDateAndAssigneeId
  // ---------------------------------------------------------------------------
  describe('getTaskTimeEntryByDateAndAssigneeId', () => {
    it('queries by assigneeID and the supplied date', async () => {
      const entry = { ID: 1, AssignedToID: 42, TaskID: 10, Hours: 3.5, EntryDate: FIXED_NOW }
      mockFindFirst.mockResolvedValueOnce(entry)

      const result = await getTaskTimeEntryByDateAndAssigneeId(42, FIXED_NOW)

      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { AssignedToID: 42, EntryDate: FIXED_NOW },
        })
      )
      expect(result).toEqual(entry)
    })

    it('defaults entryDate to today (new Date()) when not provided', async () => {
      mockFindFirst.mockResolvedValueOnce(null)

      await getTaskTimeEntryByDateAndAssigneeId(42)

      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { AssignedToID: 42, EntryDate: FIXED_NOW },
        })
      )
    })

    it('returns null when no matching entry is found', async () => {
      mockFindFirst.mockResolvedValueOnce(null)

      const result = await getTaskTimeEntryByDateAndAssigneeId(99, FIXED_NOW)

      expect(result).toBeNull()
    })

    it('throws a consistent error when the query fails', async () => {
      mockFindFirst.mockRejectedValueOnce(new Error('db failure'))

      await expect(getTaskTimeEntryByDateAndAssigneeId(42, FIXED_NOW)).rejects.toThrow(
        'Failed to fetch task time entry'
      )
    })
  })

  // ---------------------------------------------------------------------------
  // getTaskTimeEntriesByTaskIDAndAssigneeID
  // ---------------------------------------------------------------------------
  describe('getTaskTimeEntriesByTaskIDAndAssigneeID', () => {
    it('queries by taskID and assigneeID and returns all matching entries', async () => {
      const entries = [
        { ID: 1, TaskID: 10, AssignedToID: 42, Hours: 2.0, EntryDate: FIXED_NOW },
        { ID: 2, TaskID: 10, AssignedToID: 42, Hours: 1.5, EntryDate: FIXED_NOW },
      ]
      mockFindMany.mockResolvedValueOnce(entries)

      const result = await getTaskTimeEntriesByTaskIDAndAssigneeID(10, 42)

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { TaskID: 10, AssignedToID: 42 },
        })
      )
      expect(result).toEqual(entries)
    })

    it('returns an empty array when no entries match', async () => {
      mockFindMany.mockResolvedValueOnce([])

      const result = await getTaskTimeEntriesByTaskIDAndAssigneeID(10, 99)

      expect(result).toEqual([])
    })

    it('throws a consistent error when the query fails', async () => {
      mockFindMany.mockRejectedValueOnce(new Error('db failure'))

      await expect(getTaskTimeEntriesByTaskIDAndAssigneeID(10, 42)).rejects.toThrow(
        'Failed to fetch task time entries'
      )
    })
  })

  // ---------------------------------------------------------------------------
  // getSumOfHoursByTaskID
  // ---------------------------------------------------------------------------
  describe('getSumOfHoursByTaskID', () => {
    it('returns the summed hours for a given taskID', async () => {
      mockAggregate.mockResolvedValueOnce({ _sum: { Hours: 7.5 } })

      const result = await getSumOfHoursByTaskID(10)

      expect(mockAggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          _sum: { Hours: true },
          where: { TaskID: 10 },
        })
      )
      expect(result).toBe(7.5)
    })

    it('returns 0 when _sum.Hours is null (no entries)', async () => {
      mockAggregate.mockResolvedValueOnce({ _sum: { Hours: null } })

      const result = await getSumOfHoursByTaskID(10)

      expect(result).toBe(0)
    })

    it('throws a consistent error when the query fails', async () => {
      mockAggregate.mockRejectedValueOnce(new Error('db failure'))

      await expect(getSumOfHoursByTaskID(10)).rejects.toThrow('Failed to fetch sum of hours for task')
    })
  })

  // ---------------------------------------------------------------------------
  // getSumOfHoursByTaskIDAndAssigneeID
  // ---------------------------------------------------------------------------
  describe('getSumOfHoursByTaskIDAndAssigneeID', () => {
    it('returns the summed hours for a given taskID and assigneeID', async () => {
      mockAggregate.mockResolvedValueOnce({ _sum: { Hours: 4.0 } })

      const result = await getSumOfHoursByTaskIDAndAssigneeID(10, 42)

      expect(mockAggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          _sum: { Hours: true },
          where: { TaskID: 10, AssignedToID: 42 },
        })
      )
      expect(result).toBe(4.0)
    })

    it('returns 0 when _sum.Hours is null (no entries)', async () => {
      mockAggregate.mockResolvedValueOnce({ _sum: { Hours: null } })

      const result = await getSumOfHoursByTaskIDAndAssigneeID(10, 42)

      expect(result).toBe(0)
    })

    it('throws a consistent error when the query fails', async () => {
      mockAggregate.mockRejectedValueOnce(new Error('db failure'))

      await expect(getSumOfHoursByTaskIDAndAssigneeID(10, 42)).rejects.toThrow(
        'Failed to fetch sum of hours for task'
      )
    })
  })

  // ---------------------------------------------------------------------------
  // createTaskTimeEntry
  // ---------------------------------------------------------------------------
  describe('createTaskTimeEntry', () => {
    it('creates a new entry when no existing entry exists for assignee/date', async () => {
      const input = {
        AssignedToID: 42,
        EntryDate: FIXED_NOW,
        TaskID: 10,
        Hours: 1.5,
      }

      mockFindFirst.mockResolvedValueOnce(null)
      mockCreate.mockResolvedValueOnce({ ID: 11 })

      const result = await createTaskTimeEntry(input)

      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { AssignedToID: 42, EntryDate: FIXED_NOW },
        })
      )
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            AssignedToID: 42,
            EntryDate: FIXED_NOW,
            TaskID: 10,
            Hours: 1.5,
            CreatedTimestamp: FIXED_NOW,
            UpdatedTimestamp: FIXED_NOW,
          },
        })
      )
      expect(result).toEqual({ ID: 11 })
    })

    it('updates existing entry and adds Hours when entry exists for assignee/date', async () => {
      const input = {
        AssignedToID: 42,
        EntryDate: FIXED_NOW,
        TaskID: 10,
        Hours: 1.5,
      }

      mockFindFirst.mockResolvedValueOnce({
        ID: 5,
        AssignedToID: 42,
        EntryDate: FIXED_NOW,
        TaskID: 10,
        Hours: 2,
      })
      mockUpdate.mockResolvedValueOnce({ ID: 5, Hours: 3.5 })

      const result = await createTaskTimeEntry(input)

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ID: 5 },
          data: {
            Hours: 3.5,
            UpdatedTimestamp: FIXED_NOW,
          },
        })
      )
      expect(mockCreate).not.toHaveBeenCalled()
      expect(result).toEqual({ ID: 5, Hours: 3.5 })
    })

    it('treats null existing Hours as 0 when updating', async () => {
      const input = {
        AssignedToID: 42,
        EntryDate: FIXED_NOW,
        TaskID: 10,
        Hours: 1.25,
      }

      mockFindFirst.mockResolvedValueOnce({
        ID: 8,
        AssignedToID: 42,
        EntryDate: FIXED_NOW,
        TaskID: 10,
        Hours: null,
      })
      mockUpdate.mockResolvedValueOnce({ ID: 8, Hours: 1.25 })

      await createTaskTimeEntry(input)

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ID: 8 },
          data: {
            Hours: 1.25,
            UpdatedTimestamp: FIXED_NOW,
          },
        })
      )
    })

    it('throws a consistent error when create path fails', async () => {
      mockFindFirst.mockResolvedValueOnce(null)
      mockCreate.mockRejectedValueOnce(new Error('db failure'))

      await expect(
        createTaskTimeEntry({
          AssignedToID: 42,
          EntryDate: FIXED_NOW,
          TaskID: 10,
          Hours: 1,
        })
      ).rejects.toThrow('Failed to create task time entry')
    })

    it('throws a consistent error when update path fails', async () => {
      mockFindFirst.mockResolvedValueOnce({
        ID: 9,
        AssignedToID: 42,
        EntryDate: FIXED_NOW,
        TaskID: 10,
        Hours: 4,
      })
      mockUpdate.mockRejectedValueOnce(new Error('db failure'))

      await expect(
        createTaskTimeEntry({
          AssignedToID: 42,
          EntryDate: FIXED_NOW,
          TaskID: 10,
          Hours: 1,
        })
      ).rejects.toThrow('Failed to create task time entry')
    })
  })
})

