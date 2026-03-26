import {
  filterTicketTasks,
  filterTicketTasksByCompletionView,
  isCompletedOrCanceledTask,
} from '@/features/tickets/taskFilters'

describe('isCompletedOrCanceledTask', () => {
  it('returns true for completed and canceled statuses', () => {
    expect(isCompletedOrCanceledTask(4)).toBe(true)
    expect(isCompletedOrCanceledTask(5)).toBe(true)
  })

  it('returns false for active or missing statuses', () => {
    expect(isCompletedOrCanceledTask(1)).toBe(false)
    expect(isCompletedOrCanceledTask(2)).toBe(false)
    expect(isCompletedOrCanceledTask(3)).toBe(false)
    expect(isCompletedOrCanceledTask(null)).toBe(false)
    expect(isCompletedOrCanceledTask(undefined)).toBe(false)
  })
})

describe('filterTicketTasksByCompletionView', () => {
  const tasks = [
    { ID: 11, StatusID: 1, TaskName: 'Not Started' },
    { ID: 12, StatusID: 2, TaskName: 'Started' },
    { ID: 13, StatusID: 4, TaskName: 'Completed' },
    { ID: 14, StatusID: 5, TaskName: 'Canceled' },
    { ID: 15, StatusID: null, TaskName: 'Unknown Status' },
  ]

  it('shows active tasks by default', () => {
    expect(filterTicketTasksByCompletionView(tasks, false)).toEqual([
      tasks[0],
      tasks[1],
      tasks[4],
    ])
  })

  it('shows only completed and canceled tasks when enabled', () => {
    expect(filterTicketTasksByCompletionView(tasks, true)).toEqual([
      tasks[2],
      tasks[3],
    ])
  })
})

describe('filterTicketTasks', () => {
  const tasks = [
    {ID: 1, TaskName: 'Bracket - rough machine', TaskTypeID: 10, AssignedToID: 101, StatusID: 1},
    {ID: 2, TaskName: 'Bracket - inspection', TaskTypeID: 11, AssignedToID: 102, StatusID: 2},
    {ID: 3, TaskName: 'Housing - polish', TaskTypeID: 10, AssignedToID: null, StatusID: 4},
  ]

  it('filters by part name case-insensitively', () => {
    expect(filterTicketTasks(tasks, {partName: 'BRACKET'})).toEqual([tasks[0], tasks[1]])
  })

  it('filters by task type, assignee, and status when provided', () => {
    expect(filterTicketTasks(tasks, {partName: '', taskTypeID: 11, assignedToID: 102, statusID: 2})).toEqual([tasks[1]])
  })

  it('returns all tasks when no filter values are provided', () => {
    expect(filterTicketTasks(tasks, {partName: ''})).toEqual(tasks)
  })
})

