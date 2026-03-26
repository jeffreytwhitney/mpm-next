/**
 * Task Data Access Module
 *
 * Handles all server-side database operations for tasks, including:
 * - Retrieving tasks by ID or project
 * - Creating and updating tasks
 * - Validating task uniqueness within a project
 * - Tracking active task counts for projects/tickets
 *
 * All database operations use error handling middleware to ensure consistent
 * error reporting and graceful failure handling.
 */
import {prisma} from "@/lib/prisma";
import type {Prisma} from "@/generated/prisma/client";
import {Prisma as PrismaNamespace} from "@/generated/prisma/client";
import {withErrorHandling} from "@/server/data/lib/errorHandling";
import {updateTicket} from "@/server/data/ticket";

/**
 * Defines which task fields are selected from the database.
 * Used consistently across all task queries to ensure uniform data structure.
 */
const taskSelect = {
    ID: true,
    StatusID: true,
    TaskName: true,
    TaskTypeID: true,
    AssignedToID: true,
    DateStarted: true,
    DrawingNumber: true,    
    DueDate: true,
    ScheduledDueDate: true,
    CreatedTimestamp: true,
    DateCompleted: true,
    ManualDueDate: true,
    CurrentlyRunning: true,
    ProjectID: true,
    Operation : true,
    UpdatedTimestamp: true,
    ManufacturingRev: true,


} satisfies Prisma.tblTaskSelect

/**
 * Represents a complete task record as returned from the database.
 * Includes all fields defined in taskSelect projection.
 */
export type TaskItem = Prisma.tblTaskGetPayload<{select: typeof taskSelect}>


/**
 * Retrieves a single task by its ID.
 *
 * @param id - The task ID to retrieve
 * @returns The task data, or null if not found
 * @throws Logs and throws an error if the database query fails
 */
export async function getTaskById(id: number): Promise<TaskItem | null> {
    return withErrorHandling(
        () => prisma.tblTask.findFirst({
            select: taskSelect,
            where: {ID: id},
        }),
        'fetching task',
        'Failed to fetch task'
    )
}


/**
 * Retrieves all tasks for a specific project.
 *
 * @param projectId - The project ID to fetch tasks for
 * @returns An array of tasks for the project (empty array if no tasks exist)
 * @throws Logs and throws an error if the database query fails
 */
export async function getTasksByProjectId(projectId: number): Promise<TaskItem[]> {
    return withErrorHandling(
        () => prisma.tblTask.findMany({
            select: taskSelect,
            where: {ProjectID: projectId},
        }),
        'fetching tasks by project',
        'Failed to fetch tasks'
    )
}


/**
 * Input data for creating a new task.
 * Only ProjectID, Operation, and StatusID are required; all other fields are optional.
 * Timestamps (CreatedTimestamp, UpdatedTimestamp) are automatically set.
 *
 * @property ProjectID - The project/ticket ID this task belongs to (required)
 * @property StatusID - The task's status ID (required)
 * @property Operation - The operation number for the task (required)
 * @property TaskName - The name or description of the task
 * @property TaskTypeID - The type of task (e.g., inspection, manufacturing)
 * @property DrawingNumber - Associated drawing or document reference
 * @property DueDate - The hard deadline for the task
 * @property ScheduledDueDate - The originally planned due date
 * @property ManualDueDate - Flag for manually set due date (0 or 1)
 * @property ManufacturingRev - Manufacturing revision level (e.g., A, B, C)
 * @property EstimatedHours - Estimated hours needed to complete the task
 * @property AssignedToID - User ID of the person assigned to this task
 * @property DateStarted - When work on the task actually started
 * @property DateCompleted - When the task was marked as complete
 * @property CurrentlyRunning - Whether the task is currently in progress (0 or 1)
 * @property UpdateUserID - ID of the user making updates
 * @property JobNumber - Associated job or work order number
 */
export interface TaskCreateInput {
    ProjectID: number
    StatusID: number
    TaskName?: string | null
    DrawingNumber?: string | null
    DueDate?: Date | null
    ManufacturingRev?: string | null
    Operation: string
    ScheduledDueDate?: Date | null
    EstimatedHours?: number | null
    TaskTypeID?: number | null
    AssignedToID?: number | null
    DateStarted?: Date | null
    DateCompleted?: Date | null
    ManualDueDate?: number | null
    UpdateUserID?: string | null
    CurrentlyRunning?: number
    JobNumber?: string | null
}


/**
 * Input data for updating an existing task.
 * All fields are optional; only provided fields will be updated.
 */
export type TaskUpdateInput = Partial<TaskCreateInput>

/**
 * Creates a new task and updates the parent project's active task count.
 * Automatically sets creation and update timestamps.
 *
 * @param data - The task data to create
 * @returns The newly created task with all fields populated
 * @throws Logs and throws an error if the database operation fails
 * 
 * @remarks
 * This function has the side effect of updating the parent ticket/project's
 * CountOfActiveTasks field to reflect the new active task count.
 */
export async function createTask(data: TaskCreateInput): Promise<TaskItem> {
    const now = new Date()
    const currentlyRunning = data.CurrentlyRunning ?? 0
    const task = await withErrorHandling(
        () => prisma.tblTask.create({
            select: taskSelect,
            data: {
                ...data,
                CurrentlyRunning: currentlyRunning,
                CreatedTimestamp: now,
                UpdatedTimestamp: now,
            },
        }),
        'creating task',
        'Failed to create task'
    )

    // Update ticket/project active task count
    const activeTaskCount = await countActiveTasksByProjectId(data.ProjectID)
    await updateTicket(data.ProjectID, {
        CountOfActiveTasks: activeTaskCount,
    })

    return task
}


/**
 * Updates an existing task by ID.
 * Automatically updates the UpdatedTimestamp field.
 *
 * @param id - The task ID to update
 * @param data - Partial task data with fields to update
 * @returns The updated task, or null if the task with the given ID does not exist
 * @throws Throws an error if the database operation fails (excluding not-found errors)
 */
export async function updateTask(id: number, data: TaskUpdateInput): Promise<TaskItem | null> {
    try {
        return await prisma.tblTask.update({
            select: taskSelect,
            where: {ID: id},
            data: {
                ...data,
                UpdatedTimestamp: new Date(),
            },
        })
    } catch (error) {
        if (error instanceof PrismaNamespace.PrismaClientKnownRequestError && error.code === 'P2025') {
            return null
        }
        throw error
    }
}


/**
 * Checks if a task with the same task type, name (case-insensitive),
 * operation, and manufacturing rev already exists within a specific project.
 * Used to prevent duplicate tasks from being created in the same ticket.
 *
 * @param taskName - The task name to check for duplicates
 * @param operationNumber - The operation number to check for duplicates
 * @param taskTypeID - The task type ID to check for duplicates
 * @param manufacturingRev - The rev number to check for duplicates
 * @param projectID - The project ID to scope the uniqueness check to (prevents duplicates within a ticket)
 * @returns true if a task with these exact properties exists in the project, false otherwise
 * @throws Logs and throws an error if the database query fails
 */
export async function checkExistingTask(
    taskName: string,
    operationNumber: string,
    taskTypeID: number,
    manufacturingRev: string,
    projectID: number,
): Promise<boolean> {
    const matchingTasks = await prisma.tblTask.findMany({
        select: {
            TaskName: true,
        },
        where: {
            Operation: operationNumber,
            TaskTypeID: taskTypeID,
            ManufacturingRev: manufacturingRev,
            ProjectID: projectID,
        },
    })

    const normalizedTaskName = taskName.trim().toLocaleLowerCase()
    return matchingTasks.some((task) => (task.TaskName ?? '').trim().toLocaleLowerCase() === normalizedTaskName)
}


/**
 * Counts the number of active (non-completed, non-canceled) tasks for a project.
 * Active tasks are those with StatusID other than 4 (Completed) and 5 (Canceled).
 *
 * @param projectId - The project ID to count active tasks for
 * @returns The number of active tasks in the project
 * @throws Logs and throws an error if the database query fails
 */
export async function countActiveTasksByProjectId(projectId: number): Promise<number> {
    return withErrorHandling(
        () => prisma.tblTask.count({
            where: {
                ProjectID: projectId,
                StatusID: {
                    notIn: [4, 5], // Exclude Completed (4) and Canceled (5)
                },
            },
        }),
        'counting active tasks',
        'Failed to count active tasks'
    )
}
