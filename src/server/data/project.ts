import {prisma} from "@/lib/prisma";
import type {Prisma} from "@/generated/prisma/client";
import {Prisma as PrismaNamespace} from "@/generated/prisma/client";
import {getUserById, type MPMUser} from "@/server/data/user";
import {withErrorHandling} from "@/server/data/lib/errorHandling";

// ...existing code...

const projectSelect = {
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
} satisfies Prisma.tblProjectSelect

export type ProjectItem = Prisma.tblProjectGetPayload<{select: typeof projectSelect}>

export async function getProjectById(id: number): Promise<ProjectItem> {
    const project = await withErrorHandling(
        () => prisma.tblProject.findFirst({
            select: projectSelect,
            where: {ID: id},
        }),
        'fetching project',
        'Failed to fetch project'
    )
    if (!project) {
        throw new Error('Failed to fetch project')
    }
    return project
}

export async function getQualityEngineerByProjectID(projectID: number): Promise<MPMUser | null> {
    const project = await withErrorHandling(
        () => prisma.tblProject.findFirst({
            select: {SecondaryProjectOwnerID: true},
            where: {ID: projectID},
        }),
        'fetching quality engineer project',
        'Failed to fetch quality engineer by project ID'
    )

    if (!project || project.SecondaryProjectOwnerID == null) {
        return null
    }

    return await getUserById(project.SecondaryProjectOwnerID)
}

export async function getManufacturingEngineerByProjectID(projectID: number): Promise<MPMUser | null> {
    const project = await withErrorHandling(
        () => prisma.tblProject.findFirst({
            select: {PrimaryProjectOwnerID: true},
            where: {ID: projectID},
        }),
        'fetching manufacturing engineer project',
        'Failed to fetch manufacturing engineer by project ID'
    )

    if (!project || project.PrimaryProjectOwnerID == null) {
        return null
    }

    return await getUserById(project.PrimaryProjectOwnerID)
}


export interface ProjectCreateInput {
    SiteID: number
    TicketNumber: string
    ProjectName: string
    ProjectDescription?: string | null
    DepartmentID: number
    PrimaryProjectOwnerID?: number | null
    SecondaryProjectOwnerID: number
    InitiatorEmployeeID: number
    CountOfActiveTasks: number
    CarbonCopyEmailList?: string | null
    RequiresModels: number
}

export type ProjectUpdateInput = Partial<ProjectCreateInput>


export async function createProject(data: ProjectCreateInput): Promise<ProjectItem> {
    const now = new Date()

    return withErrorHandling(
        () => prisma.tblProject.create({
            select: projectSelect,
            data: {
                ...data,
                CreatedTimestamp: now,
                UpdatedTimestamp: now,
            },
        }),
        'creating project',
        'Failed to create project'
    )
}

export async function updateProject(id: number, data: ProjectUpdateInput): Promise<ProjectItem | null> {
    try {
        return await prisma.tblProject.update({
            select: projectSelect,
            where: {ID: id},
            data: {
                ...data,
                UpdatedTimestamp: new Date(),
            },
        })
    } catch (error) {
        if (error instanceof PrismaNamespace.PrismaClientKnownRequestError && error.code === 'P2025') {
            return null
        }
        throw error
    }
}