import { getTaskList } from '@/app/actions/taskListActions'
import { prisma } from '@/lib/prisma'
import {getTaskById} from "@/app/actions/taskActions";

describe('Task List Actions', () => {
    afterAll(async () => {
        await prisma.$disconnect()
    })

    it('gets default active task list with the default 50 row cap', async () => {
        const results = await getTaskList()
        expect(results.length).toBeLessThanOrEqual(50)
        expect(results.every(task => task.StatusID !== null && task.StatusID < 4)).toBe(true)
    })

    it('applies activeNotWaiting preset filtering', async () => {
        const results = await getTaskList({ statusPreset: 'activeNotWaiting', pageSize: 100 })

        expect(results.every(task => task.StatusID !== null && task.StatusID < 3)).toBe(true)
    })

    it('applies status and task name filters together', async () => {
        const sample = await prisma.qryTaskList.findFirst({
            where: {
                StatusID: { lt: 4 },
                TaskName: { not: null },
            },
            select: {
                ID: true,
                StatusID: true,
                TaskName: true,
            },
        })

        expect(sample).not.toBeNull()

        if (!sample || sample.StatusID === null || !sample.TaskName) {
            throw new Error('Expected seeded task data with StatusID and TaskName')
        }

        const results = await getTaskList({
            statusID: sample.StatusID,
            taskName: sample.TaskName,
            pageSize: 100,
        })

        expect(results.length).toBeGreaterThan(0)
        expect(results.every(task => task.StatusID === sample.StatusID)).toBe(true)
        expect(results.some(task => task.ID === sample.ID)).toBe(true)
    })

    it('respects explicit page size values', async () => {
        const results = await getTaskList({ page: 1, pageSize: 5 })

        expect(results.length).toBeLessThanOrEqual(5)
    })

    it('gets task by ID and returns null for a missing ID', async () => {
        const firstTask = await prisma.tblTask.findFirst({
            select: { ID: true },
            orderBy: { ID: 'asc' },
        })
        const maxTask = await prisma.tblTask.findFirst({
            select: { ID: true },
            orderBy: { ID: 'desc' },
        })

        expect(firstTask).not.toBeNull()
        expect(maxTask).not.toBeNull()

        if (!firstTask || !maxTask) {
            throw new Error('Expected at least one task in seeded integration database')
        }

        const existing = await getTaskById(firstTask.ID)
        const missing = await getTaskById(maxTask.ID + 1_000_000)

        expect(existing).toEqual(expect.objectContaining({ ID: firstTask.ID }))
        expect(missing).toBeNull()
    })

    it('Makes sure Due Date and Scheduled Due Date are not empty strings', async () => {
        const maxTask = await prisma.tblTask.findFirst({
            select: { ID: true },
            orderBy: { ID: 'desc' },
        })

        expect(maxTask).not.toBeNull()

        if (!maxTask) {
            throw new Error('Expected at least one task in seeded integration database')
        }

        const maxTaskID = maxTask.ID

        const result = await getTaskById(maxTaskID)

        expect(result).not.toBeNull()
        if (!result) {
            throw new Error('Expected task to exist for max task ID')
        }
        const dueDate = result.DueDate
        expect(dueDate).not.toBeNull()
        expect(dueDate).toBeInstanceOf(Date)

    })
})

