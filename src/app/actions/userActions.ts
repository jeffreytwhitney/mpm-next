import {prisma} from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'


const userSelect = {
    ID:true,
    SiteID:true,
    DepartmentID:true,
    UserTypeID:true,
    EmployeeNumber:true,
    EMailAddress:true,
    NetworkUserName:true,
    FName: true,
    LName: true,
    FullName: true,
    ShortName: true,
    DisplayName: true,
    CreatedTimestamp: true,
    UpdatedTimestamp: true,
} satisfies Prisma.tblUserSelect

export interface UserDropDownOption {
    value: number,
    label: string
}


export type MPMUser = Prisma.tblUserGetPayload<{select: typeof userSelect}>

export async function getUserById(id: number): Promise<MPMUser | null> {
    try {
        return await prisma.tblUser.findFirst({
            where: {ID: id},
            select: userSelect,
        })
    } catch (error) {
        console.error('Error fetching user:', error)
        throw new Error('Failed to fetch user')
    }
}

export async function getUserByEmployeeNumber(empNum: string): Promise<MPMUser | null> {
    try {
        return await prisma.tblUser.findFirst({
            where: {EmployeeNumber: empNum},
            select: userSelect,
        })
    } catch (error) {
        console.error('Error fetching user:', error)
        throw new Error('Failed to fetch user')
    }
}

export async function getMetrologyProgrammerUsers(siteID: number): Promise<MPMUser[]> {
    try {
        return await prisma.tblUser.findMany({
            select: userSelect,
            where: {
                SiteID: siteID,
                IsActive: 1,
                UserTypeID: 1,
            }
        });
    }
    catch (error) {
        console.error('Error fetching user:', error)
        throw new Error('Failed to fetch user')
    }
}

export async function getMetrologyUsers(siteID: number): Promise<MPMUser[]> {
    try {
        return await prisma.tblUser.findMany({
            select: userSelect,
            where: {
                SiteID: siteID,
                IsActive: 1,
                UserTypeID: {in: [1, 2]},
            }
        });

    }
    catch (error) {
        console.error('Error fetching user:', error);
        throw new Error('Failed to fetch user');
    }
}

export async function getUsersByDepartmentAndUserTypeID(departmentID: number, userTypeID: number): Promise<MPMUser[]> {
    try{
        return await prisma.tblUser.findMany({
            select: userSelect,
            where: {
                DepartmentID: departmentID,
                UserTypeID: userTypeID,
            }
        });
    }
    catch(error) {
        console.error('Error fetching usersByDepartmentAndUserTypeID:', error);
        throw new Error('Failed to fetch usersByDepartmentAndUserTypeID');
    }
}

export async function getUsersBySiteIDAndUserTypeID(siteID: number, userTypeID: number): Promise<MPMUser[]> {
    try{
        return await prisma.tblUser.findMany({
            select: userSelect,
            where: {
                SiteID: siteID,
                UserTypeID: userTypeID,
            },
            orderBy: {
                FullName: 'asc',
            }
        });
    }
    catch(error) {
        console.error('Error fetching usersByDepartmentAndUserTypeID:', error);
        throw new Error('Failed to fetch usersByDepartmentAndUserTypeID');
    }
}

//These are all for dropdowns
export async function getMetrologyProgrammerDropdownOptions(siteID: number): Promise<UserDropDownOption[]> {
    try {
        const metrologyUsers = await prisma.tblUser.findMany({
            select: {
                ID: true,
                FullName: true,
            },
            where: {
                SiteID: siteID,
                IsActive: 1,
                UserTypeID: 1,
            }
        });

        return metrologyUsers
            .filter((user): user is { ID: number; FullName: string } => typeof user.FullName === 'string'
                && user.FullName.length > 0)
            .map((user) => ({
                value: user.ID,
                label: user.FullName,
            }));

    }
    catch (error) {
        console.error('Error fetching user:', error)
        throw new Error('Failed to fetch user')
    }
}

export async function getMetrologyUserDropdownOptions(siteID: number): Promise<UserDropDownOption[]> {
    try {
        const metrologyUsers = await prisma.tblUser.findMany({
            select: {
                ID: true,
                FullName: true,
            },
            where: {
                SiteID: siteID,
                IsActive: 1,
                UserTypeID: {in: [1, 2]},
            }
        });

        return metrologyUsers
            .filter((user): user is { ID: number; FullName: string } => typeof user.FullName === 'string'
                && user.FullName.length > 0)
            .map((user) => ({
                value: user.ID,
                label: user.FullName,
            }));

    }
    catch (error) {
        console.error('Error fetching user:', error)
        throw new Error('Failed to fetch user')
    }
}

export async function getQualityEngineerDropdownOptions(departmentID: number): Promise<UserDropDownOption[]> {
    try {
        const qeUsers = await prisma.tblUser.findMany({
            select: {
                ID: true,
                FullName: true,
            },
            where: {
                DepartmentID: departmentID,
                IsActive: 1,
                UserTypeID: 3,
            }
        })

        return qeUsers
            .filter((user): user is { ID: number; FullName: string } => typeof user.FullName === 'string'
                && user.FullName.length > 0)
            .map((user) => ({
                value: user.ID,
                label: user.FullName,
            }));

    }
    catch (error) {
        console.error('Error fetching user:', error)
        throw new Error('Failed to fetch user')
    }
}

export async function getManufacturingEngineerDropdownOptions(departmentID: number): Promise<UserDropDownOption[]> {
    try {
        const meUsers = await prisma.tblUser.findMany({
            select: {
                ID: true,
                FullName: true,
            },
            where: {
                DepartmentID: departmentID,
                IsActive: 1,
                UserTypeID: 4,
            }
        })

        return meUsers
            .filter((user): user is { ID: number; FullName: string } => typeof user.FullName === 'string'
                && user.FullName.length > 0)
            .map((user) => ({
                value: user.ID,
                label: user.FullName,
            }));

    }
    catch (error) {
        console.error('Error fetching user:', error)
        throw new Error('Failed to fetch user')
    }
}

export async function getCellLeadDropdownOptions(departmentID: number): Promise<UserDropDownOption[]> {
    try {
        const cellLeadUsers = await prisma.tblUser.findMany({
            select: {
                ID: true,
                FullName: true,
            },
            where: {
                DepartmentID: departmentID,
                IsActive: 1,
                UserTypeID: 5,
            }
        })

        return cellLeadUsers
            .filter((user): user is { ID: number; FullName: string } => typeof user.FullName === 'string'
                && user.FullName.length > 0)
            .map((user) => ({
                value: user.ID,
                label: user.FullName,
            }));

    }
    catch (error) {
        console.error('Error fetching user:', error)
        throw new Error('Failed to fetch user')
    }
}
