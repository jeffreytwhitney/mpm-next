import {
  TASK_STATUS_NOT_STARTED_ID,
  TASK_STATUS_STARTED_ID,
  TASK_STATUS_WAITING_ID,
  isRevertingToNotStarted,
} from '@/lib/taskStatusTransition'

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

