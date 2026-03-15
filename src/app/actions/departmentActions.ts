import {prisma} from '@/lib/prisma'

export interface DepartmentDropdownOption {value: number, label: string}
import type {Prisma} from '@/generated/prisma/client'


// Define the select object to be reused
const departmentSelect = {
    ID: true,
    DepartmentName: true,
    SiteID: true,
    ParentID: true,
    CMMFilePath: true,
    CellLeadCCList: true,
    QualityCCList: true,
    ManufacturingCCList: true,
    CreatedTimestamp: true,

} satisfies Prisma.tblDepartmentSelect
export type DepartmentItem = Prisma.tblDepartmentGetPayload<{select: typeof departmentSelect}>

export async function getDepartments(siteID: number ): Promise<DepartmentItem[]> {
    try {
        return await prisma.tblDepartment.findMany({
            select: departmentSelect,
            where: { SiteID: siteID },
            orderBy: { DepartmentName: 'asc'},
        })
    } catch (error) {
        console.error('Error fetching Departments:', error)
        throw new Error('Failed to fetch Departments')
    }
}

export async function getTopLevelDepartments(siteID: number ): Promise<DepartmentItem[]> {
    try {
        return await prisma.tblDepartment.findMany({
            select: departmentSelect,
            where: {
                SiteID: siteID,
                ParentID: null,
            },
            orderBy: {
                DepartmentName: 'asc',
            },
        })
    } catch (error) {
        console.error('Error fetching Departments:', error)
        throw new Error('Failed to fetch Departments')
    }
}

export async function getDepartmentById(id: number): Promise<DepartmentItem | null> {
    try {
        return await prisma.tblDepartment.findFirst({
            select: departmentSelect,
            where: {ID: id},
        })
    } catch (error) {
        console.error('Error fetching Department:', error)
        throw new Error('Failed to fetch Department')
    }
}


export async function getDepartmentDropdownOptions(siteID: number): Promise<DepartmentDropdownOption[]> {
    try {
        const departments = await prisma.tblDepartment.findMany({
            select: {
                ID: true,
                DepartmentName: true,
            },
            where: {
                SiteID: siteID,
            },
            orderBy: {
                DepartmentName: 'asc',
            },
        })

        return departments
            .filter((department): department is {
                ID: number;
                DepartmentName: string
            } => typeof department.DepartmentName === 'string' && department.DepartmentName.length > 0)
            .map((department) => ({
                value: department.ID,
                label: department.DepartmentName,
            }))
    } catch (error) {
        console.error('Error fetching department options:', error)
        throw new Error('Failed to fetch department options')
    }
}