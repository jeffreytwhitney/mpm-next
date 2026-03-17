import {prisma} from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import { verifyPassword } from '@/lib/hash'
import { USER_TYPES } from '@/lib/auth/roles'
import { SITE_OPTIONS } from '@/lib/site'


const userSelect = {
    ID:true,
    SiteID:true,
    DepartmentID:true,
    UserTypeID:true,
    IsAdmin: true,
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

const authUserSelect = {
    ID: true,
    SiteID: true,
    DepartmentID: true,
    UserTypeID: true,
    IsAdmin: true,
    EmployeeNumber: true,
    EMailAddress: true,
    NetworkUserName: true,
    FName: true,
    LName: true,
    FullName: true,
    ShortName: true,
    DisplayName: true,
    CreatedTimestamp: true,
    UpdatedTimestamp: true,
    Password: true,
} satisfies Prisma.tblUserSelect

export interface UserDropDownOption {
    value: number,
    label: string
}


export type MPMUser = Prisma.tblUserGetPayload<{select: typeof userSelect}>
export type MPMAuthUser = Prisma.tblUserGetPayload<{select: typeof authUserSelect}>

function normalizeIdentifier(identifier: string): string {
    return identifier.trim()
}

function toSafeUser(user: MPMAuthUser): MPMUser {
    const { Password: _password, ...safeUser } = user
    return safeUser
}

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

export async function getActiveUserForAuth(identifier: string): Promise<MPMAuthUser | null> {
    try {
        const normalizedIdentifier = normalizeIdentifier(identifier)

        if (!normalizedIdentifier) {
            return null
        }

        return await prisma.tblUser.findFirst({
            where: {
                IsActive: 1,
                OR: [
                    {EmployeeNumber: normalizedIdentifier},
                    {NetworkUserName: normalizedIdentifier},
                ],
            },
            select: authUserSelect,
        })
    } catch (error) {
        console.error('Error fetching user for auth:', error)
        throw new Error('Failed to fetch user for auth')
    }
}

export async function verifyUserCredentials(identifier: string, password: string): Promise<MPMUser | null> {
    const user = await getActiveUserForAuth(identifier)

    if (!user?.Password) {
        return null
    }

    const isValidPassword = await verifyPassword(password, user.Password)

    if (!isValidPassword) {
        return null
    }

    return toSafeUser(user)
}

export async function getMetrologyProgrammerUsers(siteID: number): Promise<MPMUser[]> {
    try {
        return await prisma.tblUser.findMany({
            select: userSelect,
            where: {
                SiteID: siteID,
                IsActive: 1,
                UserTypeID: USER_TYPES.METROLOGY_PROGRAMMER,
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
                UserTypeID: {in: [USER_TYPES.METROLOGY_PROGRAMMER, USER_TYPES.METROLOGY_CALIBRATION_TECHNICIAN]},
            },
            orderBy: {
                FullName: 'asc',
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
const configuredSiteIDs = SITE_OPTIONS.map((site) => Number(site.id)).filter(Number.isInteger)

export async function getMetrologyProgrammerDropdownOptions(): Promise<UserDropDownOption[]> {
    try {
        const metrologyUsers = await prisma.tblUser.findMany({
            select: {
                ID: true,
                FullName: true,
            },
            where: {
                SiteID: {in: configuredSiteIDs},
                IsActive: 1,
                UserTypeID: USER_TYPES.METROLOGY_PROGRAMMER,
            },
            orderBy: {
                FullName: 'asc',
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
                DisplayName: true,
            },
            where: {
                SiteID: siteID,
                IsActive: 1,
                UserTypeID: {in: [USER_TYPES.METROLOGY_PROGRAMMER, USER_TYPES.METROLOGY_CALIBRATION_TECHNICIAN]},
            },
            orderBy: {
                DisplayName: 'asc',
            }
        });

        return metrologyUsers
            .filter((user): user is { ID: number; DisplayName: string } => typeof user.DisplayName === 'string'
                && user.DisplayName.length > 0)
            .map((user) => ({
                value: user.ID,
                label: user.DisplayName,
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
                UserTypeID: USER_TYPES.QUALITY_ENGINEER,
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
                UserTypeID: USER_TYPES.MANUFACTURING_ENGINEER,
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
                UserTypeID: USER_TYPES.CELL_LEADER,
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

