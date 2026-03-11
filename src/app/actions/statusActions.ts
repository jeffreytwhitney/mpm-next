import {prisma} from "@/lib/prisma";
import {TaskStatusOption} from "@/app/actions/taskListActions";

export async function getTaskStatusOptions(): Promise<TaskStatusOption[]> {
    try {
        const statuses = await prisma.tblStatus.findMany({
            select: {
                ID: true,
                Status: true,
            },
            orderBy: {
                ID: 'asc',
            },
        })

        return statuses
            .filter((status): status is {
                ID: number;
                Status: string
            } => typeof status.Status === 'string' && status.Status.length > 0)
            .map((status) => ({
                value: status.ID,
                label: status.Status,
            }))
    } catch (error) {
        console.error('Error fetching task status options:', error)
        throw new Error('Failed to fetch task status options')
    }
}