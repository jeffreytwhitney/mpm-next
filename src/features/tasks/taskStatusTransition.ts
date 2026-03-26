/**
 * Task Status Transition Logic Module
 *
 * Defines valid task status values and business rules for status transitions including:
 * - Status ID constants (Not Started, Started, Waiting, Completed, Canceled, Not Scheduled)
 * - Status activity checking (active vs. terminal states)
 * - Transition validation (e.g., reverting to Not Started)
 * - Date field logic (when to set DateStarted, when to revert)
 *
 * Used by task update logic to enforce state machine constraints.
 */
export const TASK_STATUS_NOT_STARTED_ID = 1
export const TASK_STATUS_STARTED_ID = 2
export const TASK_STATUS_WAITING_ID = 3
export const TASK_STATUS_COMPLETED_ID = 4
export const TASK_STATUS_CANCELED_ID = 5
export const TASK_STATUS_NOT_SCHEDULED_ID = 7

export function isActiveTaskStatus(statusId: number | null | undefined): boolean {
  return statusId !== TASK_STATUS_CANCELED_ID && statusId !== TASK_STATUS_COMPLETED_ID
}

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


