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

import {prisma} from '@/lib/prisma'
import {Prisma as PrismaNamespace} from '@/generated/prisma/client'
import {
  createProject,
  getProjectById,
  updateProject,
  type ProjectCreateInput,
} from '@/app/actions/projectActions'

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

