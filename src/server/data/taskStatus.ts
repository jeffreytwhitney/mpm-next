/**
 * Task Status Data Access Module
 *
 * Handles database operations for task status options including:
 * - Fetching available task status values for UI dropdowns
 * - Filtering and formatting status data for display
 *
 * Provides the reference data for task status transitions and UI filtering.
 * Status IDs are constants defined elsewhere and used for business logic checks.
 */
import {prisma} from "@/lib/prisma";

export interface TaskStatusDropdownOption {
    value: number,
    label: string
}


export async function getTaskStatusDropdownOptions(): Promise<TaskStatusDropdownOption[]> {
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