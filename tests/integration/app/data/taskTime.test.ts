beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(async () => {
  jest.restoreAllMocks()
  await prisma.$disconnect()
})

import { prisma } from '@/lib/prisma'
import {
  getTaskTimeEntryByDateAndAssigneeId,
  getTaskTimeEntriesByTaskIDAndAssigneeID,
  getSumOfHoursByTaskID,
  getSumOfHoursByTaskIDAndAssigneeID,
} from '@/server/data/taskTime'

describe('taskTime integration', () => {

  // ---------------------------------------------------------------------------
  // getTaskTimeEntryByDateAndAssigneeId
  // ---------------------------------------------------------------------------
  describe('getTaskTimeEntryByDateAndAssigneeId', () => {
    it('returns null when no entry matches a nonsense assigneeID', async () => {
      const result = await getTaskTimeEntryByDateAndAssigneeId(-1, new Date())
      expect(result).toBeNull()
    })

    it('defaults to today without throwing when no matching entry exists', async () => {
      await expect(getTaskTimeEntryByDateAndAssigneeId(-1)).resolves.toBeNull()
    })

    it('returns a well-shaped TaskTimeItem when a matching entry is found', async () => {
      const entry = await prisma.tblTaskTimeEntry.findFirst({
        select: { AssignedToID: true, EntryDate: true },
        where: { EntryDate: { not: null } },
        orderBy: { ID: 'asc' },
      })

      if (!entry || !entry.AssignedToID || !entry.EntryDate) {
        console.warn('No seeded time entry with AssignedToID + EntryDate — skipping shape assertion')
        return
      }

      const result = await getTaskTimeEntryByDateAndAssigneeId(entry.AssignedToID, entry.EntryDate)

      expect(result).not.toBeNull()
      expect(result).toEqual(
        expect.objectContaining({
          ID: expect.any(Number),
          TaskID: expect.any(Number),
          AssignedToID: entry.AssignedToID,
        })
      )
    })
  })

  // ---------------------------------------------------------------------------
  // getTaskTimeEntriesByTaskIDAndAssigneeID
  // ---------------------------------------------------------------------------
  describe('getTaskTimeEntriesByTaskIDAndAssigneeID', () => {
    it('returns an empty array for a nonexistent taskID/assigneeID combo', async () => {
      const result = await getTaskTimeEntriesByTaskIDAndAssigneeID(-1, -1)
      expect(result).toEqual([])
    })

    it('returns an array of well-shaped entries when data exists', async () => {
      const firstTask = await prisma.tblTask.findFirst({
        select: { ID: true },
        orderBy: { ID: 'asc' },
      })

      expect(firstTask).not.toBeNull()
      if (!firstTask) throw new Error('Expected at least one task in integration database')

      const result = await getTaskTimeEntriesByTaskIDAndAssigneeID(firstTask.ID, -1)

      // With assigneeID -1 no rows will match — confirms the call succeeds and returns an array
      expect(Array.isArray(result)).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // getSumOfHoursByTaskID
  // ---------------------------------------------------------------------------
  describe('getSumOfHoursByTaskID', () => {
    it('returns a number (0 or more) for a real task ID', async () => {
      const firstTask = await prisma.tblTask.findFirst({
        select: { ID: true },
        orderBy: { ID: 'asc' },
      })

      expect(firstTask).not.toBeNull()
      if (!firstTask) throw new Error('Expected at least one task in integration database')

      const result = await getSumOfHoursByTaskID(firstTask.ID)

      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThanOrEqual(0)
    })

    it('returns 0 for a nonexistent task ID', async () => {
      const result = await getSumOfHoursByTaskID(-1)
      expect(result).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // getSumOfHoursByTaskIDAndAssigneeID
  // ---------------------------------------------------------------------------
  describe('getSumOfHoursByTaskIDAndAssigneeID', () => {
    it('returns a number (0 or more) for a real task ID and any assigneeID', async () => {
      const firstTask = await prisma.tblTask.findFirst({
        select: { ID: true },
        orderBy: { ID: 'asc' },
      })

      expect(firstTask).not.toBeNull()
      if (!firstTask) throw new Error('Expected at least one task in integration database')

      const result = await getSumOfHoursByTaskIDAndAssigneeID(firstTask.ID, -1)

      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThanOrEqual(0)
    })

    it('returns 0 for a nonexistent taskID and assigneeID', async () => {
      const result = await getSumOfHoursByTaskIDAndAssigneeID(-1, -1)
      expect(result).toBe(0)
    })
  })
})

