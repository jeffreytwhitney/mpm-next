beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

const mockCreateTicketRecord = jest.fn()
const mockCreateTaskRecord = jest.fn()
const mockRevalidatePath = jest.fn()
const mockRequireCurrentUser = jest.fn()

jest.mock('@/server/data/ticket', () => ({
  createTicket: (...args: unknown[]) => mockCreateTicketRecord(...args),
}))

jest.mock('@/server/data/task', () => ({
  createTask: (...args: unknown[]) => mockCreateTaskRecord(...args),
}))

jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

jest.mock('@/lib/auth/currentUser', () => ({
  requireCurrentUser: (...args: unknown[]) => mockRequireCurrentUser(...args),
}))

import {USER_TYPE_IDS} from '@/lib/auth/roles'
import {createTicket} from '@/features/tickets/actions/addTicketAction'

interface BuildValidFormDataOptions {
  overrides?: Record<string, string>
  copyUserEmailAddresses?: string[]
  taskRows?: Array<{
    taskName: string
    taskTypeID: string
    opNumber: string
    dueDate: string
    scheduledDueDate: string
    manufacturingRev: string
    drawingNumber: string
  }>
}

function buildValidFormData(options: BuildValidFormDataOptions = {}): FormData {
  const formData = new FormData()

  formData.set('siteID', '12')
  formData.set('ticketNumber', '')
  formData.set('ticketName', 'Fixture build')
  formData.set('ticketDescription', 'Build a new inspection fixture')
  formData.set('departmentID', '7')
  formData.set('qualityEngineerID', '22')
  formData.set('manufacturingEngineerID', '31')
  formData.set('initiatorEmployeeID', '99')
  formData.set('requiresNewModels', 'on')

  for (const email of options.copyUserEmailAddresses ?? ['owner@example.com']) {
    formData.append('copyUserEmailAddresses', email)
  }

  for (const [index, taskRow] of (options.taskRows ?? []).entries()) {
    formData.set(`tasks[${index}][taskName]`, taskRow.taskName)
    formData.set(`tasks[${index}][taskTypeID]`, taskRow.taskTypeID)
    formData.set(`tasks[${index}][opNumber]`, taskRow.opNumber)
    formData.set(`tasks[${index}][dueDate]`, taskRow.dueDate)
    formData.set(`tasks[${index}][scheduledDueDate]`, taskRow.scheduledDueDate)
    formData.set(`tasks[${index}][manufacturingRev]`, taskRow.manufacturingRev)
    formData.set(`tasks[${index}][drawingNumber]`, taskRow.drawingNumber)
  }

  if (options.overrides) {
    for (const [key, value] of Object.entries(options.overrides)) {
      formData.set(key, value)
    }
  }

  return formData
}

describe('createTicket action', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockRequireCurrentUser.mockResolvedValue({
      userType: USER_TYPE_IDS.metrologyProgrammer,
      userId: 500,
      departmentID: 7,
    })
  })

  it('returns per-email validation errors for invalid and duplicate addresses', async () => {
    const formData = buildValidFormData({
      copyUserEmailAddresses: ['owner@example.com', 'not-an-email', 'OWNER@example.com'],
    })

    await expect(createTicket(formData)).resolves.toEqual({
      success: false,
      fieldErrors: {
        'copyUserEmailAddresses.0': 'Email address must be unique.',
        'copyUserEmailAddresses.1': 'Email address is invalid.',
        'copyUserEmailAddresses.2': 'Email address must be unique.',
      },
      values: {
        ticketName: 'Fixture build',
        ticketDescription: 'Build a new inspection fixture',
        departmentID: '7',
        qualityEngineerID: '22',
        manufacturingEngineerID: '31',
        requiresNewModels: 'on',
        copyUserEmailAddresses: ['owner@example.com', 'not-an-email', 'OWNER@example.com'],
        tasks: [],
      },
    })

    expect(mockRequireCurrentUser).not.toHaveBeenCalled()
    expect(mockCreateTicketRecord).not.toHaveBeenCalled()
    expect(mockCreateTaskRecord).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })

  it('creates the ticket, ignores blank email rows, and persists tasks when valid', async () => {
    const formData = buildValidFormData({
      copyUserEmailAddresses: ['owner@example.com', '', 'backup@example.com'],
      taskRows: [
        {
          taskName: 'Inspection',
          taskTypeID: '5',
          opNumber: '20',
          dueDate: '2026-04-15',
          scheduledDueDate: '2026-04-14',
          manufacturingRev: 'B',
          drawingNumber: 'DWG-5000',
        },
      ],
    })

    mockCreateTicketRecord.mockResolvedValueOnce({ID: 555})
    mockCreateTaskRecord.mockResolvedValueOnce({ID: 1001})

    await expect(createTicket(formData)).resolves.toEqual({
      success: true,
      fieldErrors: {},
    })

    expect(mockRequireCurrentUser).toHaveBeenCalledTimes(1)
    expect(mockCreateTicketRecord).toHaveBeenCalledWith({
      SiteID: 12,
      TicketNumber: '',
      ProjectName: 'Fixture build',
      ProjectDescription: 'Build a new inspection fixture',
      DepartmentID: 7,
      PrimaryProjectOwnerID: 31,
      SecondaryProjectOwnerID: 22,
      InitiatorEmployeeID: 99,
      CarbonCopyEmailList: 'owner@example.com, backup@example.com',
      RequiresModels: 1,
    })
    expect(mockCreateTaskRecord).toHaveBeenCalledWith({
      ProjectID: 555,
      StatusID: 1,
      TaskName: 'Inspection',
      DrawingNumber: 'DWG-5000',
      DueDate: new Date('2026-04-15'),
      ManufacturingRev: 'B',
      Operation: '20',
      ScheduledDueDate: new Date('2026-04-14'),
      TaskTypeID: 5,
      CurrentlyRunning: 0,
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/tickets')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/tasks')
  })

  it('requires a manufacturing engineer when requires models is checked', async () => {
    const formData = buildValidFormData({
      overrides: {
        manufacturingEngineerID: '',
        requiresNewModels: 'on',
      },
    })

    await expect(createTicket(formData)).resolves.toEqual({
      success: false,
      fieldErrors: {
        manufacturingEngineerID: 'Manufacturing engineer is required when "Requires Models" is selected.',
      },
      values: {
        ticketName: 'Fixture build',
        ticketDescription: 'Build a new inspection fixture',
        departmentID: '7',
        qualityEngineerID: '22',
        manufacturingEngineerID: '',
        requiresNewModels: 'on',
        copyUserEmailAddresses: ['owner@example.com'],
        tasks: [],
      },
    })

    expect(mockRequireCurrentUser).not.toHaveBeenCalled()
    expect(mockCreateTicketRecord).not.toHaveBeenCalled()
    expect(mockCreateTaskRecord).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })

  it('returns validation errors for all server-level required fields when form data is empty', async () => {
    const formData = buildValidFormData({
      overrides: {
        siteID: '',
        ticketName: '',
        departmentID: '',
        qualityEngineerID: '',
        initiatorEmployeeID: '',
        manufacturingEngineerID: '',
        requiresNewModels: '',
      },
    })

    await expect(createTicket(formData)).resolves.toEqual({
      success: false,
      fieldErrors: {
        siteID: 'Site is required.',
        ticketName: 'Ticket name is required.',
        departmentID: 'Department is required.',
        qualityEngineerID: 'Quality engineer is required.',
        initiatorEmployeeID: 'Initiator is required.',
      },
      values: {
        ticketName: '',
        ticketDescription: 'Build a new inspection fixture',
        departmentID: '',
        qualityEngineerID: '',
        manufacturingEngineerID: '',
        requiresNewModels: '',
        copyUserEmailAddresses: ['owner@example.com'],
        tasks: [],
      },
    })

    expect(mockRequireCurrentUser).not.toHaveBeenCalled()
    expect(mockCreateTicketRecord).not.toHaveBeenCalled()
  })

  it('returns an invalid manufacturing engineer error when the ME field is non-numeric', async () => {
    const formData = buildValidFormData({overrides: {manufacturingEngineerID: 'not-a-number'}})

    await expect(createTicket(formData)).resolves.toEqual({
      success: false,
      fieldErrors: {
        manufacturingEngineerID: 'Manufacturing engineer is invalid.',
      },
      values: {
        ticketName: 'Fixture build',
        ticketDescription: 'Build a new inspection fixture',
        departmentID: '7',
        qualityEngineerID: '22',
        manufacturingEngineerID: 'not-a-number',
        requiresNewModels: 'on',
        copyUserEmailAddresses: ['owner@example.com'],
        tasks: [],
      },
    })

    expect(mockRequireCurrentUser).not.toHaveBeenCalled()
    expect(mockCreateTicketRecord).not.toHaveBeenCalled()
  })

  it('parses email addresses submitted with dot-notation indexed keys', async () => {
    const formData = buildValidFormData({copyUserEmailAddresses: []})
    formData.set('copyUserEmailAddresses.0', 'dot@example.com')
    formData.set('copyUserEmailAddresses.1', 'dot2@example.com')

    mockRequireCurrentUser.mockResolvedValueOnce({
      userType: USER_TYPE_IDS.metrologyProgrammer,
      userId: 500,
      departmentID: 7,
    })
    mockCreateTicketRecord.mockResolvedValueOnce({ID: 400})

    await expect(createTicket(formData)).resolves.toEqual({success: true, fieldErrors: {}})

    expect(mockCreateTicketRecord).toHaveBeenCalledWith(
      expect.objectContaining({CarbonCopyEmailList: 'dot@example.com, dot2@example.com'}),
    )
  })

  it('falls back to semicolon-delimited carbonCopyEmailList when no modern email fields are present', async () => {
    // Build from scratch so no copyUserEmailAddresses keys exist – required to reach the legacy path.
    // Also intentionally omits requiresNewModels / requiresModels to exercise the
    // getTrimmedFormValue empty-fallback branch.
    const formData = new FormData()
    formData.set('siteID', '12')
    formData.set('ticketNumber', '')
    formData.set('ticketName', 'Legacy Email Test')
    formData.set('ticketDescription', '')
    formData.set('departmentID', '7')
    formData.set('qualityEngineerID', '22')
    formData.set('manufacturingEngineerID', '31')
    formData.set('initiatorEmployeeID', '99')
    formData.set('carbonCopyEmailList', 'alpha@example.com;beta@example.com, gamma@example.com')

    mockRequireCurrentUser.mockResolvedValueOnce({
      userType: USER_TYPE_IDS.metrologyProgrammer,
      userId: 500,
      departmentID: 7,
    })
    mockCreateTicketRecord.mockResolvedValueOnce({ID: 500})

    await expect(createTicket(formData)).resolves.toEqual({success: true, fieldErrors: {}})

    expect(mockCreateTicketRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        CarbonCopyEmailList: 'alpha@example.com, beta@example.com, gamma@example.com',
      }),
    )
  })

  it('parses task fields submitted with dot-notation keys', async () => {
    const formData = buildValidFormData()
    formData.set('tasks.0.taskName', 'Dot Task')
    formData.set('tasks.0.taskTypeID', '5')
    formData.set('tasks.0.opNumber', '30')
    formData.set('tasks.0.dueDate', '2026-04-15')
    formData.set('tasks.0.scheduledDueDate', '2026-04-14')
    formData.set('tasks.0.manufacturingRev', 'C')
    formData.set('tasks.0.drawingNumber', '')

    mockRequireCurrentUser.mockResolvedValueOnce({
      userType: USER_TYPE_IDS.metrologyProgrammer,
      userId: 500,
      departmentID: 7,
    })
    mockCreateTicketRecord.mockResolvedValueOnce({ID: 200})
    mockCreateTaskRecord.mockResolvedValueOnce({ID: 201})

    await expect(createTicket(formData)).resolves.toEqual({success: true, fieldErrors: {}})

    expect(mockCreateTaskRecord).toHaveBeenCalledWith(
      expect.objectContaining({TaskName: 'Dot Task', Operation: '30'}),
    )
  })

  it('parses task fields submitted with suffix-notation keys', async () => {
    const formData = buildValidFormData()
    formData.set('taskName_0', 'Suffix Task')
    formData.set('taskTypeID_0', '5')
    formData.set('opNumber_0', '40')
    formData.set('dueDate_0', '2026-04-15')
    formData.set('scheduledDueDate_0', '2026-04-14')
    formData.set('manufacturingRev_0', 'D')
    formData.set('drawingNumber_0', '')

    mockRequireCurrentUser.mockResolvedValueOnce({
      userType: USER_TYPE_IDS.metrologyProgrammer,
      userId: 500,
      departmentID: 7,
    })
    mockCreateTicketRecord.mockResolvedValueOnce({ID: 300})
    mockCreateTaskRecord.mockResolvedValueOnce({ID: 301})

    await expect(createTicket(formData)).resolves.toEqual({success: true, fieldErrors: {}})

    expect(mockCreateTaskRecord).toHaveBeenCalledWith(
      expect.objectContaining({TaskName: 'Suffix Task', Operation: '40'}),
    )
  })

  it('skips completely empty task rows and creates the ticket without any task records', async () => {
    const formData = buildValidFormData({
      taskRows: [
        {
          taskName: '',
          taskTypeID: '',
          opNumber: '',
          dueDate: '',
          scheduledDueDate: '',
          manufacturingRev: '',
          drawingNumber: '',
        },
      ],
    })

    mockRequireCurrentUser.mockResolvedValueOnce({
      userType: USER_TYPE_IDS.metrologyProgrammer,
      userId: 500,
      departmentID: 7,
    })
    mockCreateTicketRecord.mockResolvedValueOnce({ID: 100})

    await expect(createTicket(formData)).resolves.toEqual({success: true, fieldErrors: {}})

    expect(mockCreateTicketRecord).toHaveBeenCalledTimes(1)
    expect(mockCreateTaskRecord).not.toHaveBeenCalled()
  })

  it('returns per-task validation errors for a non-empty but incomplete task row', async () => {
    const formData = buildValidFormData({
      taskRows: [
        {
          taskName: 'Some Task',
          taskTypeID: '',
          opNumber: '',
          dueDate: '',
          scheduledDueDate: '',
          manufacturingRev: '',
          drawingNumber: '',
        },
      ],
    })

    const result = await createTicket(formData)
    const fieldErrors = result.fieldErrors as Record<string, string>

    expect(result.success).toBe(false)
    expect(fieldErrors['tasks.0.taskTypeID']).toBe('Task Type is required.')
    expect(fieldErrors['tasks.0.opNumber']).toBe('Op number is required.')
    expect(fieldErrors['tasks.0.manufacturingRev']).toBe('Rev is required.')
    expect(mockRequireCurrentUser).not.toHaveBeenCalled()
    expect(mockCreateTicketRecord).not.toHaveBeenCalled()
  })

  it('overrides the quality engineer and department from the QE session when the current user is a quality engineer', async () => {
    mockRequireCurrentUser.mockResolvedValueOnce({
      userType: USER_TYPE_IDS.qualityEngineer,
      userId: 5,
      departmentID: 10,
    })
    mockCreateTicketRecord.mockResolvedValueOnce({ID: 555})

    const formData = buildValidFormData()

    await expect(createTicket(formData)).resolves.toEqual({success: true, fieldErrors: {}})

    // Form submitted departmentID=7 and qualityEngineerID=22, but QE session values (10 / 5) take precedence.
    expect(mockCreateTicketRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        DepartmentID: 10,
        SecondaryProjectOwnerID: 5,
      }),
    )
  })

  it('returns a server-side duplicate task error when two tasks share name, op, and task type', async () => {
    const sharedTask = {
      taskName: 'Part A',
      taskTypeID: '5',
      opNumber: '20',
      dueDate: '2026-04-15',
      scheduledDueDate: '2026-04-14',
      manufacturingRev: 'A',
      drawingNumber: '',
    }

    const formData = buildValidFormData({
      taskRows: [sharedTask, {...sharedTask, manufacturingRev: 'B'}],
    })

    mockRequireCurrentUser.mockResolvedValueOnce({
      userType: USER_TYPE_IDS.metrologyProgrammer,
      userId: 500,
      departmentID: 7,
    })

    const result = await createTicket(formData)
    const fieldErrors = result.fieldErrors as Record<string, string>

    expect(result.success).toBe(false)
    expect(fieldErrors['tasks.1.taskName']).toBe(
      'A task with this name, operation, and task type is already being added.',
    )
    expect(fieldErrors['tasks.1.opNumber']).toBe(
      'A task with this name, operation, and task type is already being added.',
    )
    expect(fieldErrors['tasks.1.taskTypeID']).toBe(
      'A task with this name, operation, and task type is already being added.',
    )
    expect(mockCreateTicketRecord).not.toHaveBeenCalled()
  })

  it('returns a formError when the database write fails', async () => {
    mockRequireCurrentUser.mockResolvedValueOnce({
      userType: USER_TYPE_IDS.metrologyProgrammer,
      userId: 500,
      departmentID: 7,
    })
    mockCreateTicketRecord.mockRejectedValueOnce(new Error('DB connection lost'))

    const formData = buildValidFormData()

    await expect(createTicket(formData)).resolves.toEqual({
      success: false,
      fieldErrors: {},
      formError: 'Failed to create ticket. Please try again.',
    })

    expect(mockCreateTaskRecord).not.toHaveBeenCalled()
  })

  it('accepts indexed email inputs and flags duplicates case-insensitively', async () => {
    const formData = buildValidFormData({
      copyUserEmailAddresses: [],
    })

    formData.set('copyUserEmailAddresses[0]', 'Alpha@example.com')
    formData.set('copyUserEmailAddresses[1]', 'alpha@example.com')

    await expect(createTicket(formData)).resolves.toEqual({
      success: false,
      fieldErrors: {
        'copyUserEmailAddresses.0': 'Email address must be unique.',
        'copyUserEmailAddresses.1': 'Email address must be unique.',
      },
      values: {
        ticketName: 'Fixture build',
        ticketDescription: 'Build a new inspection fixture',
        departmentID: '7',
        qualityEngineerID: '22',
        manufacturingEngineerID: '31',
        requiresNewModels: 'on',
        copyUserEmailAddresses: ['Alpha@example.com', 'alpha@example.com'],
        tasks: [],
      },
    })
  })
})

