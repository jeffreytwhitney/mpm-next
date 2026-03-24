jest.mock('@/lib/prisma', () => ({
  prisma: {
	qryTaskListRaw: {
	  findFirst: jest.fn(),
	},
  },
}))

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

const mockGetTaskById = jest.fn()
const mockGetTicketById = jest.fn()
const mockGetDepartmentById = jest.fn()
const mockGetQualityEngineerByTicketID = jest.fn()
const mockGetManufacturingEngineerByTicketID = jest.fn()

jest.mock('@/server/data/task', () => ({
  getTaskById: (...args: unknown[]) => mockGetTaskById(...args),
}))

jest.mock('@/server/data/ticket', () => ({
  getTicketById: (...args: unknown[]) => mockGetTicketById(...args),
  getQualityEngineerByTicketID: (...args: unknown[]) => mockGetQualityEngineerByTicketID(...args),
  getManufacturingEngineerByTicketID: (...args: unknown[]) => mockGetManufacturingEngineerByTicketID(...args),
}))

jest.mock('@/server/data/department', () => ({
  getDepartmentById: (...args: unknown[]) => mockGetDepartmentById(...args),
}))

import { prisma } from '@/lib/prisma'
import { getTaskDetailById } from '@/server/data/taskDetail'

const mockFindFirstTaskList = prisma.qryTaskListRaw.findFirst as jest.Mock

describe('getTaskDetailById', () => {
  beforeEach(() => {
	jest.clearAllMocks()
  })

  it('returns null when task does not exist', async () => {
	mockGetTaskById.mockResolvedValueOnce(null)

	await expect(getTaskDetailById(101)).resolves.toBeNull()
	expect(mockGetTicketById).not.toHaveBeenCalled()
	expect(mockFindFirstTaskList).not.toHaveBeenCalled()
  })

  it('returns null when task has no ProjectID', async () => {
	mockGetTaskById.mockResolvedValueOnce({ ID: 55, ProjectID: null })

	await expect(getTaskDetailById(55)).resolves.toBeNull()
	expect(mockGetTicketById).not.toHaveBeenCalled()
	expect(mockFindFirstTaskList).not.toHaveBeenCalled()
  })

  it('returns an aggregated task detail model', async () => {
	mockGetTaskById.mockResolvedValueOnce({ ID: 88, ProjectID: 9, StatusID: 2 })
	mockGetTicketById.mockResolvedValueOnce({
	  ticket: {
	    ID: 9,
	    TicketNumber: 'TK-900',
	    ProjectDescription: 'Fixture',
	    DepartmentID: 5,
	    SecondaryProjectOwnerID: 77,
	    PrimaryProjectOwnerID: 66,
	  },
	  tasks: [],
	})
	mockGetDepartmentById.mockResolvedValueOnce({ ID: 5, DepartmentName: 'Quality' })
	mockGetQualityEngineerByTicketID.mockResolvedValueOnce({ ID: 77, FullName: 'Q Engineer' })
	mockGetManufacturingEngineerByTicketID.mockResolvedValueOnce({ ID: 66, FullName: 'M Engineer' })
	mockFindFirstTaskList.mockResolvedValueOnce({ JobNumber: 'JOB-42', SumOfHours: 12 })

	const result = await getTaskDetailById(88)

	expect(mockFindFirstTaskList).toHaveBeenCalledWith({
	  select: { JobNumber: true, SumOfHours: true },
	  where: { ID: 88 },
	})
	expect(result).toEqual({
	  task: { ID: 88, ProjectID: 9, StatusID: 2 },
	  ticket: {
		ID: 9,
		TicketNumber: 'TK-900',
		ProjectDescription: 'Fixture',
		DepartmentID: 5,
		SecondaryProjectOwnerID: 77,
		PrimaryProjectOwnerID: 66,
	  },
	  departmentName: 'Quality',
	  qualityEngineerName: 'Q Engineer',
	  manufacturingEngineerName: 'M Engineer',
	  jobNumber: 'JOB-42',
	  totalTrackedHours: 12,
	})
  })

  it('maps optional display values to null when not available', async () => {
	mockGetTaskById.mockResolvedValueOnce({ ID: 90, ProjectID: 9 })
	mockGetTicketById.mockResolvedValueOnce({ ticket: { ID: 9, DepartmentID: 5 }, tasks: [] })
	mockGetDepartmentById.mockResolvedValueOnce(null)
	mockGetQualityEngineerByTicketID.mockResolvedValueOnce(null)
	mockGetManufacturingEngineerByTicketID.mockResolvedValueOnce(null)
	mockFindFirstTaskList.mockResolvedValueOnce(null)

	await expect(getTaskDetailById(90)).resolves.toEqual({
	  task: { ID: 90, ProjectID: 9 },
	  ticket: { ID: 9, DepartmentID: 5 },
	  departmentName: null,
	  qualityEngineerName: null,
	  manufacturingEngineerName: null,
	  jobNumber: null,
	  totalTrackedHours: null,
	})
  })

  it('throws a consistent error when loading fails', async () => {
	mockGetTaskById.mockRejectedValueOnce(new Error('db fail'))

	await expect(getTaskDetailById(3)).rejects.toThrow('Failed to fetch task detail')
  })
})

