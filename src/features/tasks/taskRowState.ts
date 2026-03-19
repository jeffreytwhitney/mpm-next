import {parseDateValue, startOfDay} from '@/lib/date'

type TaskRowStateInput = {
  DueDate: unknown
  DateStarted: unknown
  StatusID: number | null | undefined
}

export interface TaskRowStateFlags {
  isOverdue: boolean
  isStarted: boolean
  isWaiting: boolean
  isCompleted: boolean
  startedMoreThanMonthAgo: boolean
}

export function getTaskRowStateFlags(task: TaskRowStateInput, referenceDate: Date = new Date()): TaskRowStateFlags {
  const today = startOfDay(referenceDate)
  const oneMonthAgo = new Date(today)
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  const dueDate = parseDateValue(task.DueDate)
  const startedDate = parseDateValue(task.DateStarted)
  const statusID = task.StatusID

  const isOverdue = dueDate ? startOfDay(dueDate) <= today : false
  const isStarted = statusID === 2
  const isWaiting = statusID === 3
  const isCompleted = statusID === 4 || statusID === 5
  const startedMoreThanMonthAgo = startedDate ? startOfDay(startedDate) < oneMonthAgo : false

  return {
    isOverdue,
    isStarted,
    isWaiting,
    isCompleted,
    startedMoreThanMonthAgo,
  }
}


