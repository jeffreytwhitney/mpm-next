beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

const mockGetTaskById = jest.fn()
const mockUpdateTaskRecord = jest.fn()
const mockCountActiveTasksByProjectId = jest.fn()
const mockCreateTaskNote = jest.fn()
const mockCreateTaskTimeEntry = jest.fn()
const mockGetTicketById = jest.fn()
const mockGetQualityEngineerByTicketID = jest.fn()
const mockUpdateTicket = jest.fn()
const mockRevalidatePath = jest.fn()

jest.mock('@/server/data/task', () => ({
  getTaskById: (...args: unknown[]) => mockGetTaskById(...args),
  updateTask: (...args: unknown[]) => mockUpdateTaskRecord(...args),
  countActiveTasksByProjectId: (...args: unknown[]) => mockCountActiveTasksByProjectId(...args),
}))

jest.mock('@/server/data/taskNote', () => ({
  createTaskNote: (...args: unknown[]) => mockCreateTaskNote(...args),
}))

jest.mock('@/server/data/ticket', () => ({
  getTicketById: (...args: unknown[]) => mockGetTicketById(...args),
  getQualityEngineerByTicketID: (...args: unknown[]) => mockGetQualityEngineerByTicketID(...args),
  updateTicket: (...args: unknown[]) => mockUpdateTicket(...args),
}))

jest.mock('@/server/data/taskTime', () => ({
  createTaskTimeEntry: (...args: unknown[]) => mockCreateTaskTimeEntry(...args),
}))

jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

import {
  TASK_STATUS_CANCELED_ID,
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

  it('rejects non-positive assignee ids before data access', async () => {
    const formData = buildValidFormData({ assigneeID: '0' })

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

  it('requires canceledNote when moving active task to Canceled', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_CANCELED_ID),
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
        canceledNote: 'Canceled note is required when setting status to Canceled.',
      },
    })

    expect(mockUpdateTaskRecord).not.toHaveBeenCalled()
    expect(mockCreateTaskNote).not.toHaveBeenCalled()
  })

  it('creates a note when moving active task to Canceled with note', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_CANCELED_ID),
      canceledNote: 'Canceled due to customer request.',
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
      TaskNote: 'Canceled due to customer request.',
    })
  })

  it('does not require or create a note when task is already Canceled', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_CANCELED_ID),
    })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_CANCELED_ID,
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

  it('returns required-field errors when the form is missing key values', async () => {
    const formData = buildValidFormData({
      taskName: '',
      statusId: '',
      opNumber: '',
      dueDate: '',
      scheduledDueDate: '',
      manufacturingRev: '',
    })

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: false,
      fieldErrors: {
        taskName: 'Task name is required.',
        statusId: 'Status is required.',
        opNumber: 'Op number is required.',
        dueDate: 'Due date is required.',
        scheduledDueDate: 'Scheduled due date is required.',
        manufacturingRev: 'Rev is required.',
      },
    })
  })

  it('returns a status validation error for non-integer statuses', async () => {
    const formData = buildValidFormData({ statusId: 'abc' })

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: false,
      fieldErrors: {
        statusId: 'Status is invalid.',
      },
    })
  })

  it('returns date validation errors for invalid dates', async () => {
    const formData = buildValidFormData({
      dueDate: 'bad-date',
      scheduledDueDate: 'also-bad',
    })

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: false,
      fieldErrors: {
        dueDate: 'Due date is invalid.',
        scheduledDueDate: 'Scheduled due date is invalid.',
      },
    })
  })

  it('returns only scheduled due date error when due date is valid', async () => {
    const formData = buildValidFormData({
      dueDate: '2026-03-20',
      scheduledDueDate: 'not-a-date',
    })

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: false,
      fieldErrors: {
        scheduledDueDate: 'Scheduled due date is invalid.',
      },
    })
  })

  it('requires waiting note when waiting reason is other', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_WAITING_ID),
      waitingReason: 'other',
      waitingNote: '',
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
        waitingNote: 'Waiting note is required when selecting "Other".',
      },
    })
  })

  it('creates the waiting-for-part canned note when transitioning to Waiting', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_WAITING_ID),
      waitingReason: 'waiting-for-part',
    })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_STARTED_ID,
      AssignedToID: null,
      DateStarted: null,
      ProjectID: 55,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce({ ID: 100 })

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: true,
      fieldErrors: {},
    })

    expect(mockCreateTaskNote).toHaveBeenCalledWith({
      TaskID: 100,
      TaskNote: 'Waiting for part in order to complete the program.',
    })
  })

  it('creates waiting-for-permission note using quality engineer fallback name', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_WAITING_ID),
      waitingReason: 'waiting-for-permission',
    })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_STARTED_ID,
      AssignedToID: null,
      DateStarted: null,
      ProjectID: 321,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce({ ID: 100 })
    mockGetTicketById.mockResolvedValueOnce({ ticket: { ID: 321 } })
    mockGetQualityEngineerByTicketID.mockResolvedValueOnce(null)

    await updateTask(100, { success: false, fieldErrors: {} }, formData)

    expect(mockCreateTaskNote).toHaveBeenCalledWith({
      TaskID: 100,
      TaskNote: 'Waiting for Permission to release from Quality Engineer',
    })
  })

  it('creates waiting-for-permission note using quality engineer full name when available', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_WAITING_ID),
      waitingReason: 'waiting-for-permission',
    })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_STARTED_ID,
      AssignedToID: null,
      DateStarted: null,
      ProjectID: 321,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce({ ID: 100 })
    mockGetTicketById.mockResolvedValueOnce({ ticket: { ID: 321 } })
    mockGetQualityEngineerByTicketID.mockResolvedValueOnce({ FullName: 'Jane QE' })

    await updateTask(100, { success: false, fieldErrors: {} }, formData)

    expect(mockCreateTaskNote).toHaveBeenCalledWith({
      TaskID: 100,
      TaskNote: 'Waiting for Permission to release from Jane QE',
    })
  })

  it('does not create waiting-for-permission note when task has no project id', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_WAITING_ID),
      waitingReason: 'waiting-for-permission',
    })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_STARTED_ID,
      AssignedToID: null,
      DateStarted: null,
      ProjectID: null,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce({ ID: 100 })

    await updateTask(100, { success: false, fieldErrors: {} }, formData)

    expect(mockGetTicketById).not.toHaveBeenCalled()
    expect(mockGetQualityEngineerByTicketID).not.toHaveBeenCalled()
    expect(mockCreateTaskNote).not.toHaveBeenCalled()
  })

  it('returns task not found when initial task lookup fails', async () => {
    const formData = buildValidFormData()
    mockGetTaskById.mockResolvedValueOnce(null)

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: false,
      fieldErrors: {},
      formError: 'Task was not found.',
    })
  })

  it('returns task not found when update call returns null', async () => {
    const formData = buildValidFormData()
    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_NOT_STARTED_ID,
      AssignedToID: null,
      DateStarted: null,
      ProjectID: 22,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce(null)

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: false,
      fieldErrors: {},
      formError: 'Task was not found.',
    })
  })

  it('updates active task count on completed transitions with a project id', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_COMPLETED_ID),
      completedNote: 'Done',
    })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_STARTED_ID,
      AssignedToID: null,
      DateStarted: null,
      DateCompleted: null,
      ProjectID: 50,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce({ ID: 100 })
    mockCountActiveTasksByProjectId.mockResolvedValueOnce(4)

    await updateTask(100, { success: false, fieldErrors: {} }, formData)

    expect(mockCountActiveTasksByProjectId).toHaveBeenCalledWith(50)
    expect(mockUpdateTicket).toHaveBeenCalledWith(50, { CountOfActiveTasks: 4 })
  })

  it('persists manual due date flag and null drawing number', async () => {
    const formData = buildValidFormData({
      drawingNumber: '',
      manualDueDate: 'on',
    })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_NOT_STARTED_ID,
      AssignedToID: null,
      DateStarted: null,
      ProjectID: 50,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce({ ID: 100 })

    await updateTask(100, { success: false, fieldErrors: {} }, formData)

    expect(mockUpdateTaskRecord).toHaveBeenCalledWith(
      100,
      expect.objectContaining({
        ManualDueDate: 1,
        DrawingNumber: null,
      }),
    )
  })

  it('creates a task time entry when completing with entryDate and hours', async () => {
    const formData = buildValidFormData({
      statusId: String(TASK_STATUS_COMPLETED_ID),
      entryDate: '2026-03-22',
      hours: '1.75',
    })

    mockGetTaskById.mockResolvedValueOnce({
      ID: 100,
      StatusID: TASK_STATUS_STARTED_ID,
      AssignedToID: null,
      DateStarted: null,
      DateCompleted: null,
      ProjectID: 50,
    })
    mockUpdateTaskRecord.mockResolvedValueOnce({ ID: 100 })
    mockCountActiveTasksByProjectId.mockResolvedValueOnce(2)
    mockCreateTaskTimeEntry.mockResolvedValueOnce({ ID: 1 })

    await updateTask(100, { success: false, fieldErrors: {} }, formData)

    expect(mockCreateTaskTimeEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        TaskID: 100,
        AssignedToID: 27,
        Hours: 1.75,
      }),
    )
  })

  it('returns a generic form error when an unexpected exception is thrown', async () => {
    const formData = buildValidFormData()
    mockGetTaskById.mockRejectedValueOnce(new Error('boom'))

    await expect(updateTask(100, { success: false, fieldErrors: {} }, formData)).resolves.toEqual({
      success: false,
      fieldErrors: {},
      formError: 'Unable to save task right now. Please try again.',
    })
  })
})

