'use client'

import React from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import type { qryTaskListModel } from '@/generated/prisma/models'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({columns, data,}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b bg-slate-100 dark:bg-slate-800">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2 text-left font-medium"
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
        </thead>
        <tbody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="h-24 text-center text-slate-500"
              >
                No results.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// Column definitions for the task list table
export const taskColumns: ColumnDef<qryTaskListModel>[] = [
  {
    accessorKey: 'ID',
    header: 'ID',
    cell: ({ row }) => <div>{row.getValue('ID')}</div>,
  },
  {
    accessorKey: 'TaskName',
    header: 'Task Name',
    cell: ({ row }) => <div>{row.getValue('TaskName') || '-'}</div>,
  },
  {
    accessorKey: 'TicketNumber',
    header: 'Ticket Number',
    cell: ({ row }) => <div>{row.getValue('TicketNumber') || '-'}</div>,
  },
  {
    accessorKey: 'DrawingNumber',
    header: 'Drawing Number',
    cell: ({ row }) => <div>{row.getValue('DrawingNumber') || '-'}</div>,
  },
  {
    accessorKey: 'Operation',
    header: 'Operation',
    cell: ({ row }) => <div>{row.getValue('Operation') || '-'}</div>,
  },
  {
    accessorKey: 'DueDate',
    header: 'Due Date',
    cell: ({ row }) => {
      const date = row.getValue('DueDate') as Date | null
      return <div>{date ? new Date(date).toLocaleDateString() : '-'}</div>
    },
  },
  {
    accessorKey: 'StatusID',
    header: 'Status',
    cell: ({ row }) => <div>{row.getValue('StatusID') || '-'}</div>,
  },
]

