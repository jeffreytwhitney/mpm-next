'use client'

import React from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  RowData,
} from '@tanstack/react-table'
import type { qryTaskListModel } from '@/generated/prisma/models'

// Extend TanStack Table to support alignment metadata
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'center' | 'right'
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

// Helper function to get alignment classes
function getAlignmentClass(align?: 'left' | 'center' | 'right'): string {
  switch (align) {
    case 'center':
      return 'text-center'
    case 'right':
      return 'text-right'
    case 'left':
    default:
      return 'text-left'
  }
}

export function DataTable<TData, TValue>({columns, data,}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  // Memoize columns to prevent unnecessary re-renders
  const memoizedColumns = React.useMemo(() => columns, [columns])

  // Memoize data to prevent unnecessary re-renders
  const memoizedData = React.useMemo(() => data, [data])

  const table = useReactTable({
    data: memoizedData,
    columns: memoizedColumns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
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
                  className={`px-1 py-2 font-medium text-xs ${getAlignmentClass(header.column.columnDef.meta?.align)}`}
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
        </thead>
        <tbody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b hover:bg-slate-50 dark:hover:bg-slate-900 text-[11px]"
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

// Column definitions for the task list table
export const taskColumns: ColumnDef<qryTaskListModel>[] = [
  {
    accessorKey: 'TicketNumber',
    header: 'Ticket Nbr',
    cell: ({ row }) => <div>{row.getValue('TicketNumber') || ''}</div>,
    size: 40,
    meta: {
      align: 'center',
    },
  },
  {
    accessorKey: 'TaskName',
    header: 'Task Name',
    cell: ({ row }) => {
      const taskName = row.getValue('TaskName') as string | null
      return <div>{taskName ? taskName.slice(0, 30) : ''}</div>
    },
    size: 70,
    meta: {
      align: 'left',
    },
  },
  {
    accessorKey: 'ProjectName',
    header: 'Project Name',
    cell: ({ row }) => {
      const projectName = row.getValue('ProjectName') as string | null
      return <div>{projectName ? projectName.slice(0, 30) : ''}</div>
    },
    size: 70,
    meta: {
      align: 'left',
    },
  },
  {
    accessorKey: 'CurrentlyRunning',
    header: 'Cur Run',
    cell: ({ row }) => <div>{row.getValue('CurrentlyRunning')}</div>,
    size: 20,
    meta: {
      align: 'center',
    },
  },
  {
    accessorKey: 'ManufacturingRev',
    header: 'Mfg Rev',
    cell: ({ row }) => <div>{row.getValue('ManufacturingRev') || ''}</div>,
    size: 20,
    meta: {
      align: 'center',
    },
  },
  {
    accessorKey: 'Status',
    header: 'Status',
    cell: ({ row }) => <div>{row.getValue('Status') || ''}</div>,
    size: 40,
    meta: {
      align: 'left',
    },
  },
  {
    accessorKey: 'DrawingNumber',
    header: 'Drawing Number',
    cell: ({ row }) => <div>{row.getValue('DrawingNumber') || ''}</div>,
    size: 150,
    meta: {
      align: 'left',
    },
  },
  {
    accessorKey: 'Operation',
    header: 'Op Nbr',
    cell: ({ row }) => <div>{row.getValue('Operation') || ''}</div>,
    size: 80,
    meta: {
      align: 'center',
    },
  },
  {
    accessorKey: 'DueDate',
    header: 'Due Date',
    cell: ({ row }) => {
      const date = row.getValue('DueDate') as Date | null
      return <div>{date ? new Date(date).toLocaleDateString() : ''}</div>
    },
    size: 120,
    meta: {
      align: 'center',
    },
  },

]

