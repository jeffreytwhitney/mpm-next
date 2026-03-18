import {prisma} from "@/lib/prisma";
import type {Prisma} from "@/generated/prisma/client";
import {Prisma as PrismaNamespace} from "@/generated/prisma/client";
import {getUserById, type MPMUser} from "@/server/data/user";

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
    try {

        const project = await prisma.tblProject.findFirst({
            select: projectSelect,
            where: {ID: id},
        })
        if (!project) {
            throw new Error('Failed to fetch project')
        }
        return project;

    } catch (error) {
        console.error('Error fetching project:', error)
        throw new Error('Failed to fetch project')
    }
}

export async function getQualityEngineerByProjectID(projectID: number): Promise<MPMUser | null> {
    try {
        const project = await prisma.tblProject.findFirst({
            select: {SecondaryProjectOwnerID: true},
            where: {ID: projectID},
        })

        if (!project || project.SecondaryProjectOwnerID == null) {
            return null
        }

        return await getUserById(project.SecondaryProjectOwnerID)
    } catch (error) {
        console.error('Error fetching quality engineer by project ID:', error)
        throw new Error('Failed to fetch quality engineer by project ID')
    }
}

export async function getManufacturingEngineerByProjectID(projectID: number): Promise<MPMUser | null> {
    try {
        const project = await prisma.tblProject.findFirst({
            select: {PrimaryProjectOwnerID: true},
            where: {ID: projectID},
        })

        if (!project || project.PrimaryProjectOwnerID == null) {
            return null
        }

        return await getUserById(project.PrimaryProjectOwnerID)
    } catch (error) {
        console.error('Error fetching manufacturing engineer by project ID:', error)
        throw new Error('Failed to fetch manufacturing engineer by project ID')
    }
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
    try {
        const now = new Date()

        return await prisma.tblProject.create({
            select: projectSelect,
            data: {
                ...data,
                CreatedTimestamp: now,
                UpdatedTimestamp: now,
            },
        })
    } catch (error) {
        console.error('Error creating task:', error)
        throw new Error('Failed to create task')
    }
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
        console.error('Error updating task:', error)
        throw new Error('Failed to update task')
    }
}