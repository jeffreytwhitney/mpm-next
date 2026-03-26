export interface DataTableSortState {
  column: string
  direction: 'asc' | 'desc'
}

export function getNextSortDirection(
  activeSort: DataTableSortState | null,
  column: string,
): 'asc' | 'desc' {
  return activeSort?.column === column && activeSort.direction === 'asc' ? 'desc' : 'asc'
}

export function isServerSortableColumn(
  hasSortHandler: boolean,
  sortable: boolean | undefined,
): boolean {
  return hasSortHandler && sortable !== false
}

