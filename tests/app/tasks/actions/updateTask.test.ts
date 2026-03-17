const mockGetTaskById = jest.fn()
const mockUpdateTaskRecord = jest.fn()
const mockRevalidatePath = jest.fn()

jest.mock('@/server/data/task', () => ({
  getTaskById: (...args: unknown[]) => mockGetTaskById(...args),
  updateTask: (...args: unknown[]) => mockUpdateTaskRecord(...args),
}))

jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

import { TASK_STATUS_NOT_STARTED_ID, TASK_STATUS_STARTED_ID } from '@/lib/taskStatusTransition'
import { updateTask } from '@/app/tasks/_actions/updateTask'

function buildValidFormData(overrides?: Record<string, string>): FormData {
  const formData = new FormData()

  formData.set('taskName', 'Program feature size')
  formData.set('statusId', String(TASK_STATUS_STARTED_ID))
  formData.set('assigneeID', '27')
  formData.set('opNumber', '20')
  formData.set('dueDate', '2026-03-20')
  formData.set('scheduledDueDate', '2026-03-19')
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
  })
})

