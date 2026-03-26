import {
  getNextSortDirection,
  isServerSortableColumn,
} from '@/lib/dataTableSorting'

describe('getNextSortDirection', () => {
  it('starts a new column in ascending order', () => {
    expect(getNextSortDirection(null, 'ProjectName')).toBe('asc')
    expect(getNextSortDirection({ column: 'TicketNumber', direction: 'desc' }, 'ProjectName')).toBe('asc')
  })

  it('toggles an active ascending column to descending', () => {
    expect(getNextSortDirection({ column: 'ProjectName', direction: 'asc' }, 'ProjectName')).toBe('desc')
  })

  it('returns to ascending after a descending sort on the same column', () => {
    expect(getNextSortDirection({ column: 'ProjectName', direction: 'desc' }, 'ProjectName')).toBe('asc')
  })
})

describe('isServerSortableColumn', () => {
  it('requires a sort handler', () => {
    expect(isServerSortableColumn(false, true)).toBe(false)
    expect(isServerSortableColumn(false, undefined)).toBe(false)
  })

  it('defaults columns to sortable when a handler exists', () => {
    expect(isServerSortableColumn(true, undefined)).toBe(true)
  })

  it('respects explicit non-sortable metadata', () => {
    expect(isServerSortableColumn(true, false)).toBe(false)
  })
})
