'use client'

import React from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {getAlignmentClass} from '@/lib/utils'



interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void
  renderHeaderFilter?: (columnId: string) => React.ReactNode
}

export function DataTable<TData, TValue>({columns, data, onSortChange, renderHeaderFilter}: DataTableProps<TData, TValue>) {
  const [sortState, setSortState] = React.useState<{ column: string; direction: 'asc' | 'desc' } | null>(null)

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

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b bg-slate-100">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={() => {
                    if (!onSortChange) {
                      return
                    }

                    const columnId = header.column.id
                    const nextDirection: 'asc' | 'desc' =
                      sortState?.column === columnId && sortState.direction === 'asc' ? 'desc' : 'asc'

                    setSortState({ column: columnId, direction: nextDirection })
                    onSortChange(columnId, nextDirection)
                  }}
                  className={`px-1 py-0 font-medium text-xs ${getAlignmentClass(header.column.columnDef.meta?.align)} ${onSortChange ? 'cursor-pointer hover:bg-slate-200' : ''}`}
                  style={{
                    width: header.getSize(),
                    minWidth: header.getSize(),
                    maxWidth: header.getSize(),
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
          {renderHeaderFilter ? (
            <tr className="border-b bg-slate-50">
              {table.getFlatHeaders().map((header) => (
                <th
                  key={`${header.id}-filter`}
                  className={`px-1 py-0 font-normal ${getAlignmentClass(header.column.columnDef.meta?.align)}`}
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
                className="border-b hover:bg-slate-50 text-[11px]"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-2 py-0.5 ${getAlignmentClass(cell.column.columnDef.meta?.align)}`}
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

