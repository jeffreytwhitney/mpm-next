jest.mock('@/lib/prisma', () => ({
  prisma: {
    tblTaskNotes: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { createTaskNote, getTaskNotesByTaskID } from '@/server/data/taskNote'

const mockFindManyTaskNotes = prisma.tblTaskNotes.findMany as jest.Mock
const mockCreateTaskNoteRecord = prisma.tblTaskNotes.create as jest.Mock

describe('taskNote data access', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-03-18T12:00:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('queries notes by TaskID ordered newest first', async () => {
    mockFindManyTaskNotes.mockResolvedValueOnce([{ ID: 5 }])

    const result = await getTaskNotesByTaskID(200)

    expect(mockFindManyTaskNotes).toHaveBeenCalledWith({
      select: {
        ID: true,
        TaskID: true,
        TaskNote: true,
        IsNoteAutomated: true,
        CreatedTimestamp: true,
        UpdatedTimestamp: true,
        UpdateUserID: true,
      },
      where: { TaskID: 200 },
      orderBy: { CreatedTimestamp: 'desc' },
    })
    expect(result).toEqual([{ ID: 5 }])
  })

  it('throws a consistent error when note query fails', async () => {
    mockFindManyTaskNotes.mockRejectedValueOnce(new Error('db fail'))

    await expect(getTaskNotesByTaskID(1)).rejects.toThrow('Failed to fetch task notes')
  })

  it('creates a note with defaults and timestamps', async () => {
    mockCreateTaskNoteRecord.mockResolvedValueOnce({ ID: 77 })

    const result = await createTaskNote({
      TaskID: 200,
      TaskNote: 'Waiting on approval.',
    })

    expect(mockCreateTaskNoteRecord).toHaveBeenCalledWith({
      select: {
        ID: true,
        TaskID: true,
        TaskNote: true,
        IsNoteAutomated: true,
        CreatedTimestamp: true,
        UpdatedTimestamp: true,
        UpdateUserID: true,
      },
      data: {
        TaskID: 200,
        TaskNote: 'Waiting on approval.',
        IsNoteAutomated: 0,
        CreatedTimestamp: new Date('2026-03-18T12:00:00.000Z'),
        UpdatedTimestamp: new Date('2026-03-18T12:00:00.000Z'),
        UpdateUserID: null,
      },
    })
    expect(result).toEqual({ ID: 77 })
  })

  it('throws a consistent error when note creation fails', async () => {
    mockCreateTaskNoteRecord.mockRejectedValueOnce(new Error('db fail'))

    await expect(
      createTaskNote({
        TaskID: 2,
        TaskNote: 'Note body',
      }),
    ).rejects.toThrow('Failed to create task note')
  })
})

