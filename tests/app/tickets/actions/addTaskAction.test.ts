beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

const mockCheckExistingTask = jest.fn()
const mockCreateTaskRecord = jest.fn()
const mockRevalidatePath = jest.fn()

jest.mock('@/server/data/task', () => ({
  checkExistingTask: (...args: unknown[]) => mockCheckExistingTask(...args),
  createTask: (...args: unknown[]) => mockCreateTaskRecord(...args),
}))

jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

import { addTask } from '@/features/tickets/actions/addTaskAction'

function buildValidFormData(overrides?: Record<string, string>): FormData {
  const formData = new FormData()

  formData.set('projectID', '123')
  formData.set('taskTypeID', '5')
  formData.set('dueDate', '2026-03-20')
  formData.set('scheduledDueDate', '2026-03-19')
  formData.set('taskName', 'Inspection')
  formData.set('manufacturingRev', 'B')
  formData.set('drawingNumber', 'DWG-4000')
  formData.set('opNumber', '20')

  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      formData.set(key, value)
    }
  }

  return formData
}

describe('createTask action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns required-field errors before hitting data access', async () => {
    const formData = buildValidFormData({
      projectID: '',
      taskTypeID: '',
      dueDate: '',
      scheduledDueDate: '',
      taskName: '',
      manufacturingRev: '',
      opNumber: '',
    })

    await expect(addTask(formData)).resolves.toEqual({
      success: false,
      fieldErrors: {
        projectId: 'Project ID is required.',
        taskName: 'Task name is required.',
        manufacturingRev: 'Rev is required.',
        taskTypeID: 'Task Type is required.',
        opNumber: 'Op number is required.',
        dueDate: 'Due date is required.',
        scheduledDueDate: 'Scheduled due date is required.',
      },
    })

    expect(mockCheckExistingTask).not.toHaveBeenCalled()
    expect(mockCreateTaskRecord).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })

  it('returns date validation errors when dates cannot be parsed', async () => {
    const formData = buildValidFormData({
      dueDate: 'not-a-date',
      scheduledDueDate: 'also-not-a-date',
    })

    await expect(addTask(formData)).resolves.toEqual({
      success: false,
      fieldErrors: {
        dueDate: 'Due date is invalid.',
        scheduledDueDate: 'Scheduled due date is invalid.',
      },
    })

    expect(mockCheckExistingTask).not.toHaveBeenCalled()
    expect(mockCreateTaskRecord).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })

  it('returns duplicate errors when matching task already exists', async () => {
    const formData = buildValidFormData()

    mockCheckExistingTask.mockResolvedValueOnce({ ID: 77 })

    await expect(addTask(formData)).resolves.toEqual({
      success: false,
      fieldErrors: {
        taskName: 'There is already a task with this name, op, and task type.',
        opNumber: 'There is already a task with this name, op, and task type.',
        taskTypeID: 'There is already a task with this name, op, and task type.',
      },
    })

    expect(mockCheckExistingTask).toHaveBeenCalledWith('Inspection', '20', 5)
    expect(mockCreateTaskRecord).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })

  it('creates the task and revalidates the ticket route when valid and unique', async () => {
    const formData = buildValidFormData()

    mockCheckExistingTask.mockResolvedValueOnce(null)
    mockCreateTaskRecord.mockResolvedValueOnce({ ID: 1001 })

    await expect(addTask(formData)).resolves.toEqual({
      success: true,
      fieldErrors: {},
    })

    expect(mockCheckExistingTask).toHaveBeenCalledWith('Inspection', '20', 5)
    expect(mockCreateTaskRecord).toHaveBeenCalledTimes(1)

    const payload = mockCreateTaskRecord.mock.calls[0][0]
    expect(payload).toEqual({
      ProjectID: 123,
      TaskTypeID: 5,
      DueDate: new Date('2026-03-20'),
      ScheduledDueDate: new Date('2026-03-19'),
      TaskName: 'Inspection',
      ManufacturingRev: 'B',
      DrawingNumber: 'DWG-4000',
      Operation: '20',
      StatusID: 1,
      CurrentlyRunning: 0,
    })

    expect(mockRevalidatePath).toHaveBeenCalledWith('/tickets/123')
  })
})

