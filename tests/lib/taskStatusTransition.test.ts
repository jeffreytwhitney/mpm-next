beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

import {
  TASK_STATUS_CANCELLED_ID,
  TASK_STATUS_COMPLETED_ID,
  TASK_STATUS_NOT_STARTED_ID,
  TASK_STATUS_STARTED_ID,
  TASK_STATUS_WAITING_ID,
  isRevertingToNotStarted,
} from '@/features/tasks/taskStatusTransition'

describe('status ID constants', () => {
  it('keeps Completed and Cancelled IDs mapped to the expected values', () => {
    expect(TASK_STATUS_COMPLETED_ID).toBe(4)
    expect(TASK_STATUS_CANCELLED_ID).toBe(5)
  })
})

describe('isRevertingToNotStarted', () => {
  it('returns true when moving Started to Not Started', () => {
    expect(isRevertingToNotStarted(TASK_STATUS_STARTED_ID, TASK_STATUS_NOT_STARTED_ID)).toBe(true)
  })

  it('returns true when moving Waiting to Not Started', () => {
    expect(isRevertingToNotStarted(TASK_STATUS_WAITING_ID, TASK_STATUS_NOT_STARTED_ID)).toBe(true)
  })

  it('returns false for other transitions', () => {
    expect(isRevertingToNotStarted(TASK_STATUS_NOT_STARTED_ID, TASK_STATUS_STARTED_ID)).toBe(false)
    expect(isRevertingToNotStarted(null, TASK_STATUS_NOT_STARTED_ID)).toBe(false)
    expect(isRevertingToNotStarted(TASK_STATUS_STARTED_ID, TASK_STATUS_WAITING_ID)).toBe(false)
  })
})

