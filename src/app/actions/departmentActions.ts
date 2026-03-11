import {prisma} from '@/lib/prisma'

export async function getDepartments(siteID: number ) {
    try {
        return await prisma.tblDepartment.findMany({
            select: {
                ID: true,
                SiteID: true,
                DepartmentName: true,

            },
            where: {
                SiteID: siteID,

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

export async function getDepartmentById(id: number) {
    try {
        return await prisma.tblDepartment.findFirst({
            where: {ID: id},
        })
    } catch (error) {
        console.error('Error fetching Department:', error)
        throw new Error('Failed to fetch Department')
    }
}