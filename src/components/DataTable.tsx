'use client'

/**
 * AUTO-GENERATED MODULE DOC
 * Shared UI component module for 'DataTable'.
 */
import React from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {getAlignmentClass} from '@/lib/utils'
import {getNextSortDirection, isServerSortableColumn} from '@/lib/dataTableSorting'



interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  renderHeaderFilter?: (columnId: string) => React.ReactNode
  getRowClassName?: (rowData: TData) => string
  getRowStyle?: (rowData: TData) => React.CSSProperties | undefined
}

export function DataTable<TData, TValue>({columns, data, onSortChange, sortColumn, sortDirection, renderHeaderFilter, getRowClassName, getRowStyle}: DataTableProps<TData, TValue>) {
  // Memoize columns to prevent unnecessary re-renders
  const memoizedColumns = React.useMemo(() => columns, [columns])

  // Memoize data to prevent unnecessary re-renders
  const memoizedData = React.useMemo(() => data, [data])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: memoizedData,
    columns: memoizedColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  const activeSort = sortColumn
    ? {
        column: sortColumn,
        direction: sortDirection ?? 'asc',
      }
    : null

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b bg-slate-100">
              {headerGroup.headers.map((header) => (
                (() => {
                  const sortable = isServerSortableColumn(Boolean(onSortChange), header.column.columnDef.meta?.sortable)

                  return (
                    <th
                      key={header.id}
                      onClick={() => {
                        if (!onSortChange || !sortable) {
                          return
                        }

                        const columnId = header.column.id
                        const nextDirection = getNextSortDirection(activeSort, columnId)
                        onSortChange(columnId, nextDirection)
                      }}
                      className={`px-0 py-0 font-medium text-xs ${getAlignmentClass(header.column.columnDef.meta?.align)} ${sortable ? 'cursor-pointer hover:bg-slate-200' : ''}`}
                      style={{
                        width: header.getSize(),
                        minWidth: header.getSize(),
                        maxWidth: header.getSize(),
                      }}
                    >
                      <span className="inline-flex items-center gap-0.5 px-1 py-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {sortable && activeSort?.column === header.column.id && (
                          <span className="text-[8px] leading-none text-black select-none">
                            {activeSort.direction === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </span>
                    </th>
                  )
                })()
              ))}
            </tr>
          ))}
          {renderHeaderFilter ? (
            <tr className="border-b bg-slate-50">
              {table.getFlatHeaders().map((header) => (
                <th
                  key={`${header.id}-filter`}
                  className={`px-.5 py-0 font-normal ${getAlignmentClass(header.column.columnDef.meta?.align)}`}
                  style={{
                    width: header.getSize(),
                    minWidth: header.getSize(),
                    maxWidth: header.getSize(),
                  }}
                >
                  {renderHeaderFilter(header.column.id)}
                </th>
              ))}
            </tr>
          ) : null}
        </thead>
        <tbody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`border-b hover:bg-slate-50 text-[11px] ${getRowClassName ? getRowClassName(row.original) : ''}`}
                style={getRowStyle ? getRowStyle(row.original) : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-0 py-0.5 ${getAlignmentClass(cell.column.columnDef.meta?.align)}`}
                    style={{
                      width: cell.column.getSize(),
                      minWidth: cell.column.getSize(),
                      maxWidth: cell.column.getSize(),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="h-24 text-center text-slate-500">
                No results.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

