import {prisma} from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import {TaskListItem} from "@/app/actions/taskListActions";

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


export type MPMUser = Prisma.tblUserGetPayload<{
    select: typeof userSelect
}>


export async function getUserById(id: number) {
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

export async function getUserByEmployeeNumber(empNum: string) {
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