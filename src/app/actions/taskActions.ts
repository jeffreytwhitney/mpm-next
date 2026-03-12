import {prisma} from "@/lib/prisma";

export async function getTaskById(id: number) {
    try {
        return await prisma.tblTask.findFirst({
            where: {ID: id},
        })
    } catch (error) {
        console.error('Error fetching task:', error)
        throw new Error('Failed to fetch task')
    }
}