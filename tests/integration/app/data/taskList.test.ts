beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(async () => {
  jest.restoreAllMocks()
  await prisma.$disconnect()
})

import { getTaskList } from '@/server/data/queries/taskList'
import { prisma } from '@/lib/prisma'
import {getTaskById} from "@/server/data/task";

describe('Task List Actions', () => {

    it('gets default active task list with the default 25 row cap', async () => {
        const results = await getTaskList()
        expect(results.tasks.length).toBeLessThanOrEqual(25)
        expect(results.tasks.every(task => task.StatusID !== null && task.StatusID < 4)).toBe(true)
    })

    it('applies activeNotWaiting preset filtering', async () => {
        const results = await getTaskList({ statusPreset: 'activeNotWaiting', pageSize: 100 })
        expect(results.tasks.every(task => task.StatusID !== null && task.StatusID < 3)).toBe(true)
    })

    it('applies status and task name filters together', async () => {
        const baseResults = await getTaskList({ pageSize: 100 })
        const sample = baseResults.tasks.find((task) => task.StatusID !== null && !!task.TaskName)

        if (!sample || sample.StatusID === null || !sample.TaskName) {
            throw new Error('Expected seeded task data with StatusID and TaskName')
        }

        const results = await getTaskList({
            statusID: sample.StatusID,
            taskName: sample.TaskName,
            pageSize: 100,
        })

        expect(results.tasks.length).toBeGreaterThan(0)
        expect(results.tasks.every(task => task.StatusID === sample.StatusID)).toBe(true)
        expect(results.tasks.some(task => task.ID === sample.ID)).toBe(true)
    })

    it('respects explicit page size values', async () => {
        const results = await getTaskList({ page: 1, pageSize: 5 })

        expect(results.tasks.length).toBeLessThanOrEqual(5)
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

    it('returns non-empty DueDate values for task list rows', async () => {
        const results = await getTaskList({ pageSize: 100 })

        expect(results.tasks.length).toBeGreaterThan(0)

        for (const task of results.tasks) {
            const dueDate = task.DueDate as unknown as Date | string | null | undefined
            const normalizedDueDate = typeof dueDate === 'string' ? dueDate.trim() : dueDate

            expect(normalizedDueDate).toBeTruthy()

            if (typeof normalizedDueDate === 'string') {
                const parsed = new Date(normalizedDueDate)
                expect(Number.isNaN(parsed.getTime())).toBe(false)
            }
        }

    })
})

