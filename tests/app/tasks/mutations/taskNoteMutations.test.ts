const mockCreateTaskNote = jest.fn()

jest.mock('@/server/data/taskNote', () => ({
  createTaskNote: (...args: unknown[]) => mockCreateTaskNote(...args),
}))

import { addTaskNote } from '@/features/tasks/mutations/taskNoteMutations'

describe('taskNoteMutations.addTaskNote', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('throws when note is blank after trimming', async () => {
    await expect(addTaskNote({ taskId: 3, note: '   ' })).rejects.toThrow('Task note is required.')

    expect(mockCreateTaskNote).not.toHaveBeenCalled()
  })

  it('sends a trimmed note with required fields only by default', async () => {
    const result = { ID: 11 }
    mockCreateTaskNote.mockResolvedValueOnce(result)

    await expect(addTaskNote({ taskId: 3, note: '  Needs setup  ' })).resolves.toEqual(result)

    expect(mockCreateTaskNote).toHaveBeenCalledWith({
      TaskID: 3,
      TaskNote: 'Needs setup',
    })
  })

  it('serializes updateUserId and includes optional automation flag', async () => {
    const result = { ID: 12 }
    mockCreateTaskNote.mockResolvedValueOnce(result)

    await expect(
      addTaskNote({
        taskId: 44,
        note: 'Ready for review',
        updateUserId: 123,
        isAutomated: 1,
      }),
    ).resolves.toEqual(result)

    expect(mockCreateTaskNote).toHaveBeenCalledWith({
      TaskID: 44,
      TaskNote: 'Ready for review',
      UpdateUserID: '123',
      IsNoteAutomated: 1,
    })
  })

  it('passes null update user id through explicitly when provided', async () => {
    mockCreateTaskNote.mockResolvedValueOnce({ ID: 13 })

    await addTaskNote({
      taskId: 9,
      note: 'System generated',
      updateUserId: null,
    })

    expect(mockCreateTaskNote).toHaveBeenCalledWith({
      TaskID: 9,
      TaskNote: 'System generated',
      UpdateUserID: null,
    })
  })
})

