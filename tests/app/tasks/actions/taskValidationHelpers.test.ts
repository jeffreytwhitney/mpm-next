import { isTaskRowEmpty, validateAndParseTaskFields } from '@/features/tasks/actions/taskValidationHelpers'

describe('taskValidationHelpers.validateAndParseTaskFields', () => {
  it('parses and normalizes valid input', () => {
    const setError = jest.fn()

    const parsed = validateAndParseTaskFields(
      {
        taskName: '  Probe feature  ',
        taskTypeID: '5',
        opNumber: ' 30 ',
        dueDate: '2026-04-01',
        scheduledDueDate: '2026-03-31',
        manufacturingRev: '  A ',
        drawingNumber: '   ',
      },
      setError,
    )

    expect(parsed).toMatchObject({
      taskName: 'Probe feature',
      taskTypeID: 5,
      operation: '30',
      manufacturingRev: 'A',
      drawingNumber: null,
    })
    expect(setError).not.toHaveBeenCalled()
  })

  it('returns null when required non-date fields are missing even if dates parse', () => {
    const setError = jest.fn()

    const parsed = validateAndParseTaskFields(
      {
        taskName: '',
        taskTypeID: '5',
        opNumber: '',
        dueDate: '2026-04-01',
        scheduledDueDate: '2026-03-31',
        manufacturingRev: '',
      },
      setError,
      'tasks.0',
    )

    expect(parsed).toBeNull()
    expect(setError).toHaveBeenCalledWith('tasks.0.taskName', 'Task name is required.')
    expect(setError).toHaveBeenCalledWith('tasks.0.opNumber', 'Op number is required.')
    expect(setError).toHaveBeenCalledWith('tasks.0.manufacturingRev', 'Rev is required.')
  })

  it('returns null and sets invalid date errors for unparseable dates', () => {
    const setError = jest.fn()

    const parsed = validateAndParseTaskFields(
      {
        taskName: 'Valid Name',
        taskTypeID: '9',
        opNumber: '10',
        dueDate: 'invalid',
        scheduledDueDate: 'still-invalid',
        manufacturingRev: 'B',
      },
      setError,
    )

    expect(parsed).toBeNull()
    expect(setError).toHaveBeenCalledWith('dueDate', 'Due date is invalid.')
    expect(setError).toHaveBeenCalledWith('scheduledDueDate', 'Scheduled due date is invalid.')
  })

  it('handles completely missing raw fields via default empty values', () => {
    const setError = jest.fn()

    const parsed = validateAndParseTaskFields({}, setError)

    expect(parsed).toBeNull()
    expect(setError).toHaveBeenCalledWith('taskName', 'Task name is required.')
    expect(setError).toHaveBeenCalledWith('manufacturingRev', 'Rev is required.')
    expect(setError).toHaveBeenCalledWith('opNumber', 'Op number is required.')
    expect(setError).toHaveBeenCalledWith('taskTypeID', 'Task Type is required.')
    expect(setError).toHaveBeenCalledWith('dueDate', 'Due date is required.')
    expect(setError).toHaveBeenCalledWith('scheduledDueDate', 'Scheduled due date is required.')
  })
})

describe('taskValidationHelpers.isTaskRowEmpty', () => {
  it('returns true when all fields are blank or whitespace', () => {
    expect(
      isTaskRowEmpty({
        taskName: '  ',
        taskTypeID: ' ',
        opNumber: '',
        dueDate: undefined,
        scheduledDueDate: '',
        manufacturingRev: '\t',
        drawingNumber: '\n',
      }),
    ).toBe(true)
  })

  it('returns false when any field has a non-empty value', () => {
    expect(isTaskRowEmpty({ drawingNumber: 'DWG-100' })).toBe(false)
  })

  it('returns false when due date field contains a value', () => {
    expect(isTaskRowEmpty({ dueDate: '2026-05-01' })).toBe(false)
  })
})

