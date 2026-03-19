const mockGetTaskById = jest.fn()
const mockUpdateTaskRecord = jest.fn()
const mockCreateTaskNote = jest.fn()
const mockGetProjectById = jest.fn()
const mockGetQualityEngineerByProjectID = jest.fn()
const mockRevalidatePath = jest.fn()

jest.mock('@/server/data/task', () => ({
  getTaskById: (...args: unknown[]) => mockGetTaskById(...args),
  updateTask: (...args: unknown[]) => mockUpdateTaskRecord(...args),
}))

jest.mock('@/server/data/taskNote', () => ({
  createTaskNote: (...args: unknown[]) => mockCreateTaskNote(...args),
}))

jest.mock('@/server/data/project', () => ({
  getProjectById: (...args: unknown[]) => mockGetProjectById(...args),
  getQualityEngineerByProjectID: (...args: unknown[]) => mockGetQualityEngineerByProjectID(...args),
}))

jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

import {
  TASK_STATUS_CANCELLED_ID,
  TASK_STATUS_COMPLETED_ID,
  TASK_STATUS_NOT_SCHEDULED_ID,
  TASK_STATUS_NOT_STARTED_ID,
  TASK_STATUS_STARTED_ID,
  TASK_STATUS_WAITING_ID,
} from '@/features/tasks/taskStatusTransition'

import { updateTask } from '@/features/tasks/actions/updateTaskAction'

function buildValidFormData(overrides?: Record<string, string>): FormData {
  const formData = new FormData()

  formData.set('taskName', 'Program feature size')
  formData.set('statusId', String(TASK_STATUS_STARTED_ID))
  formData.set('assigneeID', '27')
  formData.set('opNumber', '20')
  formData.set('dueDate', '2026-03-20')
  formData.set('scheduledDueDate', '2026-03-19')
  formData.set('manufacturingRev', 'A')
  formData.set('drawingNumber', 'DWG-2001')

  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      formData.set(key, value)
    }
  }

  return formData
}

describe('updateTask action assignee behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects invalid assignee values before data access', async () => {
    const formData = buildValidFormData({ assigneeID: 'abc' })

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: false,
      fieldErrors: {
        assigneeID: 'Assignee is invalid.',
      },
    })

    expect(mockGetTaskById).not.toHaveBeenCalled()
    expect(mockUpdateTaskRecord).not.toHaveBeenCalled()
  })

  it('requires assignee when status is not Not Started', async () => {
    const formData = buildValidFormData({ assigneeID: '' })

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: false,
      fieldErrors: {
        assigneeID: 'Cannot have a status other than Not Started without an assignee.',
      },
    })

    expect(mockGetTaskById).not.toHaveBeenCalled()
    expect(mockUpdateTaskRecord).not.toHaveBeenCalled()
  })

  it('blocks removing an assignee when one is already assigned', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_NOT_STARTED_ID),
      assigneeID: '',
    })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_NOT_STARTED_ID,
      AssignedToID: 17,
    })

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: false,
      fieldErrors: {
        assigneeID: 'Cannot remove assignee once assigned.',
      },
    })

    expect(mockUpdateTaskRecord).not.toHaveBeenCalled()
  })

  it('persists changed assignee and revalidates task routes', async () => {
    const formData = buildValidFormData({ assigneeID: '44' })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_NOT_STARTED_ID,
      AssignedToID: null,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce({ ID: 100 })

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: true,
      fieldErrors: {},
    })

    expect(mockUpdateTaskRecord).toHaveBeenCalledWith(
      100,
      expect.objectContaining({
        AssignedToID: 44,
      }),
    )
    expect(mockRevalidatePath).toHaveBeenCalledWith('/tasks')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/tasks/100')
    expect(mockCreateTaskNote).not.toHaveBeenCalled()
  })

  it('allows null assignee for Not Started when task was previously unassigned', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_NOT_STARTED_ID),
      assigneeID: '',
    })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_NOT_STARTED_ID,
      AssignedToID: null,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce({ ID: 100 })

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: true,
      fieldErrors: {},
    })

    expect(mockUpdateTaskRecord).toHaveBeenCalledWith(
      100,
      expect.objectContaining({
        AssignedToID: null,
      }),
    )
    expect(mockCreateTaskNote).not.toHaveBeenCalled()
  })

  it('blocks moving Waiting back to Not Started', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_NOT_STARTED_ID),
      assigneeID: '',
    })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_WAITING_ID,
      AssignedToID: null,
      DateStarted: null,
    })

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: false,
      fieldErrors: {
        statusId: 'Cannot move a Started or Waiting task back to Not Started.',
      },
    })

    expect(mockUpdateTaskRecord).not.toHaveBeenCalled()
    expect(mockCreateTaskNote).not.toHaveBeenCalled()
  })

  it('requires waitingReason when status is set to Waiting', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_WAITING_ID),
    })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_STARTED_ID,
      AssignedToID: null,
      DateStarted: null,
    })

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: false,
      fieldErrors: {
        waitingReason: 'Please select a waiting reason.',
      },
    })

    expect(mockUpdateTaskRecord).not.toHaveBeenCalled()
    expect(mockCreateTaskNote).not.toHaveBeenCalled()
  })

  it('creates a task note when transitioning into Waiting with a note', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_WAITING_ID),
      waitingReason: 'other',
      waitingNote: 'Waiting on material from supplier.',
    })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_STARTED_ID,
      AssignedToID: null,
      DateStarted: null,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce({ ID: 100 })
    mockCreateTaskNote.mockResolvedValueOnce({ ID: 1 })

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: true,
      fieldErrors: {},
    })

    expect(mockCreateTaskNote).toHaveBeenCalledWith({
      TaskID: 100,
      TaskNote: 'Waiting on material from supplier.',
    })
  })

  it('does not require waitingNote when status remains Waiting', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_WAITING_ID),
    })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_WAITING_ID,
      AssignedToID: null,
      DateStarted: null,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce({ ID: 100 })

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: true,
      fieldErrors: {},
    })

    expect(mockUpdateTaskRecord).toHaveBeenCalled()
    expect(mockCreateTaskNote).not.toHaveBeenCalled()
  })

  it('does not create a note when status remains Waiting and note is provided', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_WAITING_ID),
      waitingNote: 'Still waiting on customer response.',
    })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_WAITING_ID,
      AssignedToID: null,
      DateStarted: null,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce({ ID: 100 })
    mockCreateTaskNote.mockResolvedValueOnce({ ID: 2 })

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: true,
      fieldErrors: {},
    })

    expect(mockCreateTaskNote).not.toHaveBeenCalled()
  })

  it('requires cancelledNote when moving active task to Cancelled', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_CANCELLED_ID),
    })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_STARTED_ID,
      AssignedToID: null,
      DateStarted: null,
    })

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: false,
      fieldErrors: {
        cancelledNote: 'Cancelled note is required when setting status to Cancelled.',
      },
    })

    expect(mockUpdateTaskRecord).not.toHaveBeenCalled()
    expect(mockCreateTaskNote).not.toHaveBeenCalled()
  })

  it('creates a note when moving active task to Cancelled with note', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_CANCELLED_ID),
      cancelledNote: 'Cancelled due to customer request.',
    })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_WAITING_ID,
      AssignedToID: null,
      DateStarted: null,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce({ ID: 100 })
    mockCreateTaskNote.mockResolvedValueOnce({ ID: 3 })

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: true,
      fieldErrors: {},
    })

    expect(mockCreateTaskNote).toHaveBeenCalledWith({
      TaskID: 100,
      TaskNote: 'Cancelled due to customer request.',
    })
  })

  it('does not require or create a note when task is already Cancelled', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_CANCELLED_ID),
    })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_CANCELLED_ID,
      AssignedToID: null,
      DateStarted: null,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce({ ID: 100 })

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: true,
      fieldErrors: {},
    })

    expect(mockCreateTaskNote).not.toHaveBeenCalled()
  })

  it('does not require completedNote when moving active task to Completed', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_COMPLETED_ID),
    })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_STARTED_ID,
      AssignedToID: null,
      DateStarted: null,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce({ ID: 100 })

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: true,
      fieldErrors: {},
    })

    expect(mockCreateTaskNote).not.toHaveBeenCalled()
  })

  it('creates a note when moving active task to Completed with note text', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_COMPLETED_ID),
      completedNote: 'Completed after final inspection.',
    })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_WAITING_ID,
      AssignedToID: null,
      DateStarted: null,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce({ ID: 100 })
    mockCreateTaskNote.mockResolvedValueOnce({ ID: 4 })

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: true,
      fieldErrors: {},
    })

    expect(mockCreateTaskNote).toHaveBeenCalledWith({
      TaskID: 100,
      TaskNote: 'Completed after final inspection.',
    })
  })

  it('sets DateStarted when moving from Not Started to Started and DateStarted is blank', async () => {
    const formData = buildValidFormData({ statusId: String(TASK_STATUS_STARTED_ID) })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_NOT_STARTED_ID,
      AssignedToID: null,
      DateStarted: null,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce({ ID: 100 })

    await updateTask(100, { success: false, fieldErrors: {} }, formData)

    expect(mockUpdateTaskRecord).toHaveBeenCalledWith(
      100,
      expect.objectContaining({
        StatusID: TASK_STATUS_STARTED_ID,
        DateStarted: expect.any(Date),
      }),
    )
  })

  it('sets DateStarted when moving from Waiting to Started and DateStarted is blank', async () => {
    const formData = buildValidFormData({ statusId: String(TASK_STATUS_STARTED_ID) })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_WAITING_ID,
      AssignedToID: null,
      DateStarted: null,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce({ ID: 100 })

    await updateTask(100, { success: false, fieldErrors: {} }, formData)

    expect(mockUpdateTaskRecord).toHaveBeenCalledWith(
      100,
      expect.objectContaining({
        StatusID: TASK_STATUS_STARTED_ID,
        DateStarted: expect.any(Date),
      }),
    )
  })

  it('sets DateStarted when moving from Not Scheduled to Started and DateStarted is blank', async () => {
    const formData = buildValidFormData({ statusId: String(TASK_STATUS_STARTED_ID) })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_NOT_SCHEDULED_ID,
      AssignedToID: null,
      DateStarted: null,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce({ ID: 100 })

    await updateTask(100, { success: false, fieldErrors: {} }, formData)

    expect(mockUpdateTaskRecord).toHaveBeenCalledWith(
      100,
      expect.objectContaining({
        StatusID: TASK_STATUS_STARTED_ID,
        DateStarted: expect.any(Date),
      }),
    )
  })

  it('does not overwrite existing DateStarted', async () => {
    const formData = buildValidFormData({ statusId: String(TASK_STATUS_STARTED_ID) })
    const existingDate = new Date('2026-03-01T00:00:00.000Z')

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_NOT_STARTED_ID,
      AssignedToID: null,
      DateStarted: existingDate,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce({ ID: 100 })

    await updateTask(100, { success: false, fieldErrors: {} }, formData)

    const updatePayload = mockUpdateTaskRecord.mock.calls[0][1]
    expect(updatePayload).not.toHaveProperty('DateStarted')
  })
})

