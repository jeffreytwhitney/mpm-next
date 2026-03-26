beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(async () => {
  jest.restoreAllMocks()
  await prisma.$disconnect()
})

import { checkExistingTask } from '@/server/data/task'
import { prisma } from '@/lib/prisma'

describe('checkExistingTask (integration - DB)', () => {

  it('returns true when querying an existing task with correct taskName, operation, and taskTypeID', async () => {
    // Get an existing task from the database
    const existingTask = await prisma.tblTask.findFirst({
      select: {
        TaskName: true,
        Operation: true,
        TaskTypeID: true,
        ProjectID: true,
      },
      where: {
        TaskName: {
          not: null,
        },
        Operation: {
          not: null,
        },
      },
    })

    if (!existingTask) {
      throw new Error('No existing task found in the database to test with')
    }

    const result = await checkExistingTask(
      existingTask.TaskName || '',
      existingTask.Operation || '',
      existingTask.TaskTypeID || 0,
      existingTask.ProjectID,
    )

    expect(result).toBe(true)
  })

  it('returns false when querying with a non-existent taskName', async () => {
    // Get an existing task and modify its taskName to something that doesn't exist
    const existingTask = await prisma.tblTask.findFirst({
      select: {
        Operation: true,
        TaskTypeID: true,
        ProjectID: true,
      },
    })

    if (!existingTask) {
      throw new Error('No existing task found in the database to test with')
    }

    const result = await checkExistingTask(
      'NON_EXISTENT_TASK_NAME_XYZ_' + Date.now(),
      existingTask.Operation || '',
      existingTask.TaskTypeID || 0,
      existingTask.ProjectID,
    )

    expect(result).toBe(false)
  })

  it('returns false when querying with matching taskName but different operation', async () => {
    // Get an existing task
    const existingTask = await prisma.tblTask.findFirst({
      select: {
        TaskName: true,
        Operation: true,
        TaskTypeID: true,
        ProjectID: true,
      },
      where: {
        TaskName: {
          not: null,
        },
      },
    })

    if (!existingTask) {
      throw new Error('No existing task found in the database to test with')
    }

    const result = await checkExistingTask(
      existingTask.TaskName || '',
      'NON_EXISTENT_OPERATION_' + Date.now(),
      existingTask.TaskTypeID || 0,
      existingTask.ProjectID,
    )

    expect(result).toBe(false)
  })

  it('returns false when querying with matching taskName and operation but different taskTypeID', async () => {
    // Get an existing task
    const existingTask = await prisma.tblTask.findFirst({
      select: {
        TaskName: true,
        Operation: true,
        TaskTypeID: true,
        ProjectID: true,
      },
    })

    if (!existingTask) {
      throw new Error('No existing task found in the database to test with')
    }

    // Use a taskTypeID that's unlikely to exist
    const result = await checkExistingTask(
      existingTask.TaskName || '',
      existingTask.Operation || '',
      999999,
      existingTask.ProjectID,
    )

    expect(result).toBe(false)
  })

  it('handles all three criteria matching correctly', async () => {
    // Create a task with specific criteria for testing
    const timestamp = Date.now().toString().slice(-6) // Use last 6 digits to keep it short
    const testTaskName = 'IntTest_' + timestamp
    const testOperation = 'OP_' + timestamp // Operation field is limited to 15 characters
    const testTypeID = 1
    const testProjectID = 1

    // First verify it doesn't exist
    let result = await checkExistingTask(testTaskName, testOperation, testTypeID, testProjectID)
    expect(result).toBe(false)

    // Create a task with these criteria
    const createdTask = await prisma.tblTask.create({
      data: {
        ProjectID: testProjectID,
        StatusID: 1, // Assuming status 1 exists
        TaskName: testTaskName,
        Operation: testOperation,
        TaskTypeID: testTypeID,
        CurrentlyRunning: 0,
      },
      select: { ID: true },
    })

    // Now verify it exists
    result = await checkExistingTask(testTaskName, testOperation, testTypeID, testProjectID)
    expect(result).toBe(true)

    // Clean up
    await prisma.tblTask.delete({
      where: { ID: createdTask.ID },
    })

    // Verify it no longer exists
    result = await checkExistingTask(testTaskName, testOperation, testTypeID, testProjectID)
    expect(result).toBe(false)
  })
})

