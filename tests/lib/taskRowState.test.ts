import {getTaskRowStateFlags} from '@/features/tasks/taskRowState'

describe('task row state flags', () => {
  const referenceDate = new Date(2026, 2, 15, 12, 0, 0, 0)

  it('marks overdue tasks when due date is today or earlier', () => {
    const overdue = getTaskRowStateFlags(
      {
        DueDate: new Date(2026, 2, 15, 12, 0, 0, 0),
        DateStarted: null,
        StatusID: 1,
      },
      referenceDate
    )

    const notOverdue = getTaskRowStateFlags(
      {
        DueDate: new Date(2026, 2, 16, 12, 0, 0, 0),
        DateStarted: null,
        StatusID: 1,
      },
      referenceDate
    )

    expect(overdue.isOverdue).toBe(true)
    expect(notOverdue.isOverdue).toBe(false)
  })

  it('derives started/waiting/completed from status IDs', () => {
    expect(
      getTaskRowStateFlags(
        {DueDate: null, DateStarted: null, StatusID: 2},
        referenceDate
      )
    ).toMatchObject({isStarted: true, isWaiting: false, isCompleted: false})

    expect(
      getTaskRowStateFlags(
        {DueDate: null, DateStarted: null, StatusID: 3},
        referenceDate
      )
    ).toMatchObject({isStarted: false, isWaiting: true, isCompleted: false})

    expect(
      getTaskRowStateFlags(
        {DueDate: null, DateStarted: null, StatusID: 4},
        referenceDate
      )
    ).toMatchObject({isStarted: false, isWaiting: false, isCompleted: true})

    expect(
      getTaskRowStateFlags(
        {DueDate: null, DateStarted: null, StatusID: 5},
        referenceDate
      )
    ).toMatchObject({isStarted: false, isWaiting: false, isCompleted: true})
  })

  it('tracks if a started date is more than one month old', () => {
    const olderThanMonth = getTaskRowStateFlags(
      {
        DueDate: null,
        DateStarted: new Date(2026, 1, 14, 12, 0, 0, 0),
        StatusID: 2,
      },
      referenceDate
    )

    const withinMonth = getTaskRowStateFlags(
      {
        DueDate: null,
        DateStarted: new Date(2026, 1, 15, 12, 0, 0, 0),
        StatusID: 2,
      },
      referenceDate
    )

    expect(olderThanMonth.startedMoreThanMonthAgo).toBe(true)
    expect(withinMonth.startedMoreThanMonthAgo).toBe(false)
  })
})

