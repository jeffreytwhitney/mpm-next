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

const departmentDropdownSelect = {
    ID: true,
    DepartmentName: true,
} satisfies Prisma.tblDepartmentSelect

type DepartmentDropdownItem = Prisma.tblDepartmentGetPayload<{select: typeof departmentDropdownSelect}>

function mapDepartmentDropdownOptions(departments: DepartmentDropdownItem[]): DepartmentDropdownOption[] {
    return departments
        .filter((department): department is DepartmentDropdownItem & {DepartmentName: string} =>
            typeof department.DepartmentName === 'string' && department.DepartmentName.length > 0,
        )
        .map((department) => ({
            value: department.ID,
            label: department.DepartmentName,
        }))
}

async function getDepartmentOptions(
    siteID: number,
    where: Prisma.tblDepartmentWhereInput = {},
): Promise<DepartmentDropdownOption[]> {
    const departments = await prisma.tblDepartment.findMany({
        select: departmentDropdownSelect,
        where: {
            SiteID: siteID,
            ...where,
        },
        orderBy: {
            DepartmentName: 'asc',
        },
    })

    return mapDepartmentDropdownOptions(departments)
}

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
        return await getDepartmentOptions(siteID)
    } catch (error) {
        console.error('Error fetching department options:', error)
        throw new Error('Failed to fetch department options')
    }
}

export async function getTopLevelDepartmentDropdownOptions(siteID: number): Promise<DepartmentDropdownOption[]> {
    try {
        return await getDepartmentOptions(siteID, {ParentID: null})
    } catch (error) {
        console.error('Error fetching top-level department options:', error)
        throw new Error('Failed to fetch top-level department options')
    }
}
