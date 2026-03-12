import {prisma} from "@/lib/prisma";
export interface TaskTypeDropdownOption {value: number, label: string}


export async function getTaskTypeDropdownOptions(): Promise<TaskTypeDropdownOption[]> {
    try {
        const statuses = await prisma.tblTaskType.findMany({
            select: {
                ID: true,
                TaskType: true,
            },
            orderBy: {
                ID: 'asc',
            },
        })

        return statuses
            .filter((status): status is {
                ID: number;
                TaskType: string
            } => typeof status.TaskType === 'string' && status.TaskType.length > 0)
            .map((status) => ({
                value: status.ID,
                label: status.TaskType,
            }))
    } catch (error) {
        console.error('Error fetching task status options:', error)
        throw new Error('Failed to fetch task status options')
    }
}
