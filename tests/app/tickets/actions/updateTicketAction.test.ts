beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

const mockGetCurrentUserRecord = jest.fn()
const mockGetTicketRecordById = jest.fn()
const mockUpdateTicketRecord = jest.fn()
const mockGetQualityEngineerDropdownOptions = jest.fn()
const mockGetManufacturingEngineerDropdownOptions = jest.fn()
const mockRevalidatePath = jest.fn()

jest.mock('@/lib/auth/currentUser', () => ({
  getCurrentUserRecord: (...args: unknown[]) => mockGetCurrentUserRecord(...args),
}))

jest.mock('@/server/data/ticket', () => ({
  getTicketRecordById: (...args: unknown[]) => mockGetTicketRecordById(...args),
  updateTicket: (...args: unknown[]) => mockUpdateTicketRecord(...args),
}))

jest.mock('@/server/data/user', () => ({
  getQualityEngineerDropdownOptions: (...args: unknown[]) => mockGetQualityEngineerDropdownOptions(...args),
  getManufacturingEngineerDropdownOptions: (...args: unknown[]) => mockGetManufacturingEngineerDropdownOptions(...args),
}))

jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

import {USER_TYPE_IDS} from '@/lib/auth/roles'
import {updateTicketAction} from '@/features/tickets/actions/updateTicketAction'

function buildValidFormData(overrides?: Record<string, string>): FormData {
  const formData = new FormData()

  formData.set('ticketName', 'Fixture build')
  formData.set('ticketDescription', 'Updated ticket description')
  formData.set('primaryProjectOwnerID', '31')
  formData.set('secondaryProjectOwnerID', '22')
  formData.set('requiresModels', 'on')

  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      formData.set(key, value)
    }
  }

  return formData
}

describe('updateTicketAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns validation errors before hitting data access', async () => {
    const formData = buildValidFormData({
      ticketName: '',
      secondaryProjectOwnerID: '',
    })

    await expect(updateTicketAction(55, {success: false, fieldErrors: {}}, formData)).resolves.toEqual({
      success: false,
      fieldErrors: {
        ticketName: 'Ticket name is required.',
        secondaryProjectOwnerID: 'Quality engineer is required.',
      },
    })

    expect(mockGetCurrentUserRecord).not.toHaveBeenCalled()
    expect(mockGetTicketRecordById).not.toHaveBeenCalled()
    expect(mockUpdateTicketRecord).not.toHaveBeenCalled()
  })

  it('rejects users without ticket edit permission', async () => {
    const formData = buildValidFormData()

    mockGetCurrentUserRecord.mockResolvedValueOnce({
      ID: 9,
      UserTypeID: USER_TYPE_IDS.manufacturingEngineer,
      DepartmentID: 25,
      IsAdmin: 0,
    })
    mockGetTicketRecordById.mockResolvedValueOnce({
      ID: 55,
      DepartmentID: 25,
    })

    await expect(updateTicketAction(55, {success: false, fieldErrors: {}}, formData)).resolves.toEqual({
      success: false,
      fieldErrors: {},
      formError: 'You do not have permission to edit this ticket.',
    })

    expect(mockGetQualityEngineerDropdownOptions).not.toHaveBeenCalled()
    expect(mockUpdateTicketRecord).not.toHaveBeenCalled()
  })

  it('allows metrology calibration technicians to edit tickets', async () => {
    const formData = buildValidFormData()

    mockGetCurrentUserRecord.mockResolvedValueOnce({
      ID: 9,
      UserTypeID: USER_TYPE_IDS.metrologyCalibrationTechnician,
      DepartmentID: 99,
      IsAdmin: 0,
    })
    mockGetTicketRecordById.mockResolvedValueOnce({
      ID: 55,
      DepartmentID: 25,
    })
    mockGetQualityEngineerDropdownOptions.mockResolvedValueOnce([{value: 22, label: 'QE User'}])
    mockGetManufacturingEngineerDropdownOptions.mockResolvedValueOnce([{value: 31, label: 'ME User'}])
    mockUpdateTicketRecord.mockResolvedValueOnce({ID: 55})

    await expect(updateTicketAction(55, {success: false, fieldErrors: {}}, formData)).resolves.toEqual({
      success: true,
      fieldErrors: {},
    })

    expect(mockUpdateTicketRecord).toHaveBeenCalledWith(55, {
      ProjectName: 'Fixture build',
      ProjectDescription: 'Updated ticket description',
      PrimaryProjectOwnerID: 31,
      SecondaryProjectOwnerID: 22,
      RequiresModels: 1,
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/tickets')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/tickets/55')
  })

  it('rejects quality engineers from a different department', async () => {
    const formData = buildValidFormData()

    mockGetCurrentUserRecord.mockResolvedValueOnce({
      ID: 9,
      UserTypeID: USER_TYPE_IDS.qualityEngineer,
      DepartmentID: 12,
      IsAdmin: 0,
    })
    mockGetTicketRecordById.mockResolvedValueOnce({
      ID: 55,
      DepartmentID: 25,
    })

    await expect(updateTicketAction(55, {success: false, fieldErrors: {}}, formData)).resolves.toEqual({
      success: false,
      fieldErrors: {},
      formError: 'You do not have permission to edit this ticket.',
    })

    expect(mockUpdateTicketRecord).not.toHaveBeenCalled()
  })

  it('rejects engineer selections outside the ticket department', async () => {
    const formData = buildValidFormData()

    mockGetCurrentUserRecord.mockResolvedValueOnce({
      ID: 9,
      UserTypeID: USER_TYPE_IDS.metrologyProgrammer,
      DepartmentID: 10,
      IsAdmin: 0,
    })
    mockGetTicketRecordById.mockResolvedValueOnce({
      ID: 55,
      DepartmentID: 25,
    })
    mockGetQualityEngineerDropdownOptions.mockResolvedValueOnce([{value: 999, label: 'Different QE'}])
    mockGetManufacturingEngineerDropdownOptions.mockResolvedValueOnce([{value: 888, label: 'Different ME'}])

    await expect(updateTicketAction(55, {success: false, fieldErrors: {}}, formData)).resolves.toEqual({
      success: false,
      fieldErrors: {
        primaryProjectOwnerID: 'Manufacturing engineer must belong to this ticket department.',
        secondaryProjectOwnerID: 'Quality engineer must belong to this ticket department.',
      },
    })

    expect(mockUpdateTicketRecord).not.toHaveBeenCalled()
  })
})

