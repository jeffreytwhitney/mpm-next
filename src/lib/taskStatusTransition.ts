export const TASK_STATUS_NOT_STARTED_ID = 1
export const TASK_STATUS_STARTED_ID = 2
export const TASK_STATUS_WAITING_ID = 3
export const TASK_STATUS_NOT_SCHEDULED_ID = 7

export function isRevertingToNotStarted(
  originalStatusId: number | null | undefined,
  nextStatusId: number | null | undefined,
): boolean {
  const isStartedOrWaiting =
    originalStatusId === TASK_STATUS_STARTED_ID || originalStatusId === TASK_STATUS_WAITING_ID

  return isStartedOrWaiting && nextStatusId === TASK_STATUS_NOT_STARTED_ID
}

export function shouldSetDateStartedForTransition(
  originalStatusId: number | null | undefined,
  nextStatusId: number | null | undefined,
): boolean {
  const canStartFrom =
    originalStatusId === TASK_STATUS_NOT_STARTED_ID ||
    originalStatusId === TASK_STATUS_WAITING_ID ||
    originalStatusId === TASK_STATUS_NOT_SCHEDULED_ID

  return canStartFrom && nextStatusId === TASK_STATUS_STARTED_ID
}

