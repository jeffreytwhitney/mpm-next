beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tblProject: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/generated/prisma/client', () => {
  class PrismaClientKnownRequestError extends Error {
    code: string

    constructor(message: string, {code}: {code: string}) {
      super(message)
      this.code = code
    }
  }

  return {
    Prisma: {
      PrismaClientKnownRequestError,
    },
  }
})

const mockGetUserById = jest.fn()

jest.mock('@/server/data/user', () => ({
  getUserById: (...args: unknown[]) => mockGetUserById(...args),
}))

const mockGetTaskListByProjectID = jest.fn()

jest.mock('@/server/data/taskList', () => ({
  getTaskListByProjectID: (...args: unknown[]) => mockGetTaskListByProjectID(...args),
}))

import {prisma} from '@/lib/prisma'
import {Prisma as PrismaNamespace} from '@/generated/prisma/client'
import {
  createTicket,
  getManufacturingEngineerByTicketID,
  getQualityEngineerByTicketID,
  getTicketById,
  updateTicket,
  type TicketCreateInput,
} from '@/server/data/ticket'

const mockFindFirst = prisma.tblProject.findFirst as jest.Mock
const mockCreate = prisma.tblProject.create as jest.Mock
const mockUpdate = prisma.tblProject.update as jest.Mock

const ticketCreateInput: TicketCreateInput = {
  SiteID: 1,
  TicketNumber: 'UT-1000',
  ProjectName: 'Fixture redesign',
  ProjectDescription: 'Unit test ticket',
  DepartmentID: 2,
  PrimaryProjectOwnerID: 10,
  SecondaryProjectOwnerID: 11,
  InitiatorEmployeeID: 12,
  CountOfActiveTasks: 3,
  CarbonCopyEmailList: 'team@example.com',
  RequiresModels: 1,
}

describe('ticketActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-01-02T03:04:05.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns the ticket with its tasks collection', async () => {
    mockFindFirst.mockResolvedValueOnce({ID: 12, TicketNumber: 'TK-12'})
    mockGetTaskListByProjectID.mockResolvedValueOnce([
      {ID: 101, ProjectID: 12, TaskName: 'First task'},
      {ID: 102, ProjectID: 12, TaskName: 'Second task'},
    ])

    const result = await getTicketById(12)

    expect(mockFindFirst).toHaveBeenCalledWith({
      select: {
        ID: true,
        SiteID: true,
        TicketNumber: true,
        ProjectName: true,
        ProjectDescription: true,
        DepartmentID: true,
        PrimaryProjectOwnerID: true,
        SecondaryProjectOwnerID: true,
        TertiaryProjectOwnerID: true,
        InitiatorEmployeeID: true,
        CountOfActiveTasks: true,
        CarbonCopyEmailList: true,
        RequiresModels: true,
        CreatedTimestamp: true,
        UpdatedTimestamp: true,
        UpdateUserID: true,
      },
      where: {ID: 12},
    })
    expect(mockGetTaskListByProjectID).toHaveBeenCalledWith(12, undefined)
    expect(result).toEqual({
      ticket: {ID: 12, TicketNumber: 'TK-12'},
      tasks: [
        {ID: 101, ProjectID: 12, TaskName: 'First task'},
        {ID: 102, ProjectID: 12, TaskName: 'Second task'},
      ],
    })
  })

  it('passes task filters through to the task collection loader', async () => {
    mockFindFirst.mockResolvedValueOnce({ID: 12, TicketNumber: 'TK-12'})
    mockGetTaskListByProjectID.mockResolvedValueOnce([])

    await getTicketById(12, {showCompleted: false, assignedToID: 9})

    expect(mockGetTaskListByProjectID).toHaveBeenCalledWith(12, {
      showCompleted: false,
      assignedToID: 9,
    })
  })

  it('throws when the ticket is not found', async () => {
    mockFindFirst.mockResolvedValueOnce(null)

    await expect(getTicketById(12)).rejects.toThrow('Failed to fetch ticket')
  })

  it('throws a consistent error when loading the ticket fails', async () => {
    mockFindFirst.mockRejectedValueOnce(new Error('db fail'))

    await expect(getTicketById(12)).rejects.toThrow('Failed to fetch ticket')
  })

  it('loads the quality engineer by SecondaryProjectOwnerID', async () => {
    mockFindFirst.mockResolvedValueOnce({SecondaryProjectOwnerID: 50})
    mockGetUserById.mockResolvedValueOnce({ID: 50})

    const result = await getQualityEngineerByTicketID(8)

    expect(mockFindFirst).toHaveBeenCalledWith({
      select: {SecondaryProjectOwnerID: true},
      where: {ID: 8},
    })
    expect(mockGetUserById).toHaveBeenCalledWith(50)
    expect(result).toEqual({ID: 50})
  })

  it('returns null when ticket does not exist for quality engineer lookup', async () => {
    mockFindFirst.mockResolvedValueOnce(null)

    await expect(getQualityEngineerByTicketID(999_999)).resolves.toBeNull()
    expect(mockGetUserById).not.toHaveBeenCalled()
  })

  it('returns null when SecondaryProjectOwnerID is null for quality engineer lookup', async () => {
    mockFindFirst.mockResolvedValueOnce({SecondaryProjectOwnerID: null})

    await expect(getQualityEngineerByTicketID(7)).resolves.toBeNull()
    expect(mockGetUserById).not.toHaveBeenCalled()
  })

  it('throws a consistent error when quality engineer lookup fails', async () => {
    mockFindFirst.mockResolvedValueOnce({SecondaryProjectOwnerID: 2})
    mockGetUserById.mockRejectedValueOnce(new Error('db fail'))

    await expect(getQualityEngineerByTicketID(44)).rejects.toThrow('Failed to fetch quality engineer by ticket ID')
  })

  it('loads the manufacturing engineer by PrimaryProjectOwnerID', async () => {
    mockFindFirst.mockResolvedValueOnce({PrimaryProjectOwnerID: 88})
    mockGetUserById.mockResolvedValueOnce({ID: 88})

    const result = await getManufacturingEngineerByTicketID(10)

    expect(mockFindFirst).toHaveBeenCalledWith({
      select: {PrimaryProjectOwnerID: true},
      where: {ID: 10},
    })
    expect(mockGetUserById).toHaveBeenCalledWith(88)
    expect(result).toEqual({ID: 88})
  })

  it('returns null when PrimaryProjectOwnerID is null for manufacturing engineer lookup', async () => {
    mockFindFirst.mockResolvedValueOnce({PrimaryProjectOwnerID: null})

    await expect(getManufacturingEngineerByTicketID(10)).resolves.toBeNull()
    expect(mockGetUserById).not.toHaveBeenCalled()
  })

  it('throws a consistent error when manufacturing engineer lookup fails', async () => {
    mockFindFirst.mockResolvedValueOnce({PrimaryProjectOwnerID: 9})
    mockGetUserById.mockRejectedValueOnce(new Error('db fail'))

    await expect(getManufacturingEngineerByTicketID(10)).rejects.toThrow('Failed to fetch manufacturing engineer by ticket ID')
  })

  it('creates a ticket with CreatedTimestamp and UpdatedTimestamp set to now', async () => {
    mockCreate.mockResolvedValueOnce({ID: 99})

    const result = await createTicket(ticketCreateInput)

    expect(mockCreate).toHaveBeenCalledWith({
      select: {
        ID: true,
        SiteID: true,
        TicketNumber: true,
        ProjectName: true,
        ProjectDescription: true,
        DepartmentID: true,
        PrimaryProjectOwnerID: true,
        SecondaryProjectOwnerID: true,
        TertiaryProjectOwnerID: true,
        InitiatorEmployeeID: true,
        CountOfActiveTasks: true,
        CarbonCopyEmailList: true,
        RequiresModels: true,
        CreatedTimestamp: true,
        UpdatedTimestamp: true,
        UpdateUserID: true,
      },
      data: {
        ...ticketCreateInput,
        CreatedTimestamp: new Date('2026-01-02T03:04:05.000Z'),
        UpdatedTimestamp: new Date('2026-01-02T03:04:05.000Z'),
      },
    })
    expect(result).toEqual({ID: 99})
  })

  it('throws a consistent error when createTicket fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('db fail'))

    await expect(createTicket(ticketCreateInput)).rejects.toThrow('Failed to create ticket')
  })

  it('updates a ticket and refreshes UpdatedTimestamp', async () => {
    mockUpdate.mockResolvedValueOnce({ID: 22, ProjectName: 'Updated ticket'})

    const result = await updateTicket(22, {ProjectName: 'Updated ticket'})

    expect(mockUpdate).toHaveBeenCalledWith({
      select: {
        ID: true,
        SiteID: true,
        TicketNumber: true,
        ProjectName: true,
        ProjectDescription: true,
        DepartmentID: true,
        PrimaryProjectOwnerID: true,
        SecondaryProjectOwnerID: true,
        TertiaryProjectOwnerID: true,
        InitiatorEmployeeID: true,
        CountOfActiveTasks: true,
        CarbonCopyEmailList: true,
        RequiresModels: true,
        CreatedTimestamp: true,
        UpdatedTimestamp: true,
        UpdateUserID: true,
      },
      where: {ID: 22},
      data: {
        ProjectName: 'Updated ticket',
        UpdatedTimestamp: new Date('2026-01-02T03:04:05.000Z'),
      },
    })
    expect(result).toEqual({ID: 22, ProjectName: 'Updated ticket'})
  })

  it('returns null for updateTicket when prisma returns P2025', async () => {
    const notFoundError = new PrismaNamespace.PrismaClientKnownRequestError('missing ticket', {
      code: 'P2025',
      clientVersion: 'test-client',
    })
    mockUpdate.mockRejectedValueOnce(notFoundError)

    await expect(updateTicket(999_999, {ProjectName: 'No-op'})).resolves.toBeNull()
  })

  it('re-throws non-P2025 update failures', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('db fail'))

    await expect(updateTicket(1, {ProjectName: 'No-op'})).rejects.toThrow('db fail')
  })
})
