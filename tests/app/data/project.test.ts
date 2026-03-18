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

import {prisma} from '@/lib/prisma'
import {Prisma as PrismaNamespace} from '@/generated/prisma/client'
import {
  createProject,
  getManufacturingEngineerByProjectID,
  getQualityEngineerByProjectID,
  getProjectById,
  updateProject,
  type ProjectCreateInput,
} from '@/server/data/project'

const mockFindFirstProject = prisma.tblProject.findFirst as jest.Mock
const mockCreateProject = prisma.tblProject.create as jest.Mock
const mockUpdateProject = prisma.tblProject.update as jest.Mock

const projectCreateInput: ProjectCreateInput = {
  SiteID: 1,
  TicketNumber: 'UT-1000',
  ProjectName: 'Fixture redesign',
  ProjectDescription: 'Unit test project',
  DepartmentID: 2,
  PrimaryProjectOwnerID: 10,
  SecondaryProjectOwnerID: 11,
  InitiatorEmployeeID: 12,
  CountOfActiveTasks: 3,
  CarbonCopyEmailList: 'team@example.com',
  RequiresModels: 1,
}

describe('projectActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-01-02T03:04:05.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('queries a project by ID', async () => {
    mockFindFirstProject.mockResolvedValueOnce({ ID: 4 })

    const result = await getProjectById(4)

    expect(mockFindFirstProject).toHaveBeenCalledWith({
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
      where: {ID: 4},
    })
    expect(result).toEqual({ ID: 4 })
  })

  it('throws a consistent error when getProjectById fails', async () => {
    mockFindFirstProject.mockRejectedValueOnce(new Error('db fail'))

    await expect(getProjectById(1)).rejects.toThrow('Failed to fetch project')
  })

  it('loads the quality engineer by SecondaryProjectOwnerID', async () => {
    mockFindFirstProject.mockResolvedValueOnce({ SecondaryProjectOwnerID: 50 })
    mockGetUserById.mockResolvedValueOnce({ ID: 50 })

    const result = await getQualityEngineerByProjectID(8)

    expect(mockFindFirstProject).toHaveBeenCalledWith({
      select: { SecondaryProjectOwnerID: true },
      where: { ID: 8 },
    })
    expect(mockGetUserById).toHaveBeenCalledWith(50)
    expect(result).toEqual({ ID: 50 })
  })

  it('returns null when project does not exist for quality engineer lookup', async () => {
    mockFindFirstProject.mockResolvedValueOnce(null)

    await expect(getQualityEngineerByProjectID(999_999)).resolves.toBeNull()
    expect(mockGetUserById).not.toHaveBeenCalled()
  })

  it('returns null when SecondaryProjectOwnerID is null for quality engineer lookup', async () => {
    mockFindFirstProject.mockResolvedValueOnce({ SecondaryProjectOwnerID: null })

    await expect(getQualityEngineerByProjectID(7)).resolves.toBeNull()
    expect(mockGetUserById).not.toHaveBeenCalled()
  })

  it('throws a consistent error when quality engineer lookup fails', async () => {
    mockFindFirstProject.mockResolvedValueOnce({ SecondaryProjectOwnerID: 2 })
    mockGetUserById.mockRejectedValueOnce(new Error('db fail'))

    await expect(getQualityEngineerByProjectID(44)).rejects.toThrow('Failed to fetch quality engineer by project ID')
  })

  it('loads the manufacturing engineer by PrimaryProjectOwnerID', async () => {
    mockFindFirstProject.mockResolvedValueOnce({ PrimaryProjectOwnerID: 88 })
    mockGetUserById.mockResolvedValueOnce({ ID: 88 })

    const result = await getManufacturingEngineerByProjectID(10)

    expect(mockFindFirstProject).toHaveBeenCalledWith({
      select: { PrimaryProjectOwnerID: true },
      where: { ID: 10 },
    })
    expect(mockGetUserById).toHaveBeenCalledWith(88)
    expect(result).toEqual({ ID: 88 })
  })

  it('returns null when PrimaryProjectOwnerID is null for manufacturing engineer lookup', async () => {
    mockFindFirstProject.mockResolvedValueOnce({ PrimaryProjectOwnerID: null })

    await expect(getManufacturingEngineerByProjectID(10)).resolves.toBeNull()
    expect(mockGetUserById).not.toHaveBeenCalled()
  })

  it('throws a consistent error when manufacturing engineer lookup fails', async () => {
    mockFindFirstProject.mockResolvedValueOnce({ PrimaryProjectOwnerID: 9 })
    mockGetUserById.mockRejectedValueOnce(new Error('db fail'))

    await expect(getManufacturingEngineerByProjectID(10)).rejects.toThrow('Failed to fetch manufacturing engineer by project ID')
  })

  it('creates a project with CreatedTimestamp and UpdatedTimestamp set to now', async () => {
    mockCreateProject.mockResolvedValueOnce({ ID: 99 })

    const result = await createProject(projectCreateInput)

    expect(mockCreateProject).toHaveBeenCalledWith({
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
        ...projectCreateInput,
        CreatedTimestamp: new Date('2026-01-02T03:04:05.000Z'),
        UpdatedTimestamp: new Date('2026-01-02T03:04:05.000Z'),
      },
    })
    expect(result).toEqual({ ID: 99 })
  })

  it('throws a consistent error when createProject fails', async () => {
    mockCreateProject.mockRejectedValueOnce(new Error('db fail'))

    await expect(createProject(projectCreateInput)).rejects.toThrow('Failed to create task')
  })

  it('updates a project and refreshes UpdatedTimestamp', async () => {
    mockUpdateProject.mockResolvedValueOnce({ ID: 22, ProjectName: 'Updated project' })

    const result = await updateProject(22, { ProjectName: 'Updated project' })

    expect(mockUpdateProject).toHaveBeenCalledWith({
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
        ProjectName: 'Updated project',
        UpdatedTimestamp: new Date('2026-01-02T03:04:05.000Z'),
      },
    })
    expect(result).toEqual({ ID: 22, ProjectName: 'Updated project' })
  })

  it('returns null for updateProject when prisma returns P2025', async () => {
    const notFoundError = new PrismaNamespace.PrismaClientKnownRequestError('missing project', {
      code: 'P2025',
      clientVersion: 'test-client',
    })
    mockUpdateProject.mockRejectedValueOnce(notFoundError)

    await expect(updateProject(999_999, { ProjectName: 'No-op' })).resolves.toBeNull()
  })

  it('throws a consistent error for non-P2025 update failures', async () => {
    mockUpdateProject.mockRejectedValueOnce(new Error('db fail'))

    await expect(updateProject(1, { ProjectName: 'No-op' })).rejects.toThrow('Failed to update task')
  })
})

