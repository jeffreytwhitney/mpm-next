// Column definitions for the task list table
import {ColumnDef} from "@tanstack/react-table";
import type {TaskListItem} from "@/app/actions/taskListActions";
import React from "react";
import Link from 'next/link'

export const taskColumns: ColumnDef<TaskListItem>[] = [
    {
        accessorKey: 'TicketNumber',
        header: 'Ticket Nbr',
        cell: ({row}) => {
            const ticketNumber = row.getValue('TicketNumber') as string | null
            const taskId = row.original.ID

            return (
                <Link href={`/tasks/${taskId}`} className="text-blue-700 hover:underline">
                    {ticketNumber || ''}
                </Link>
            )
        },
        size: 40,
        meta: {
            align: 'center',
        },
    },
    {
        accessorKey: 'TaskName',
        header: 'Task Name',
        cell: ({row}) => {
            const taskName = row.getValue('TaskName') as string | null
            const taskId = row.original.ID
            return (
                <Link href={`/tasks/${taskId}`} className="text-blue-700 hover:underline">
                    {taskName ? taskName.slice(0, 30) : ''}
                </Link>
            )
        },
        size: 70,
        meta: {
            align: 'left',
        },
    },
    {
        accessorKey: 'ProjectName',
        header: 'Project Name',
        cell: ({row}) => {
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
        cell: ({row}) => <div>{row.getValue('CurrentlyRunning')}</div>,
        size: 20,
        meta: {
            align: 'center',
        },
    },
    {
        accessorKey: 'ManufacturingRev',
        header: 'Mfg Rev',
        cell: ({row}) => <div>{row.getValue('ManufacturingRev') || ''}</div>,
        size: 20,
        meta: {
            align: 'center',
        },
    },
    {
        accessorKey: 'Status',
        header: 'Status',
        cell: ({row}) => <div>{row.getValue('Status') || ''}</div>,
        size: 40,
        meta: {
            align: 'left',
        },
    },
    {
        accessorKey: 'DrawingNumber',
        header: 'Drawing Number',
        cell: ({row}) => <div>{row.getValue('DrawingNumber') || ''}</div>,
        size: 50,
        meta: {
            align: 'left',
        },
    },
    {
        accessorKey: 'Operation',
        header: 'Op Nbr',
        cell: ({row}) => <div>{row.getValue('Operation') || ''}</div>,
        size: 80,
        meta: {
            align: 'center',
        },
    },
    {
        accessorKey: 'DueDate',
        header: 'Due Date',
        cell: ({row}) => {
            const date = row.getValue('DueDate') as Date | null
            return <div>{date ? new Date(date).toLocaleDateString() : ''}</div>
        },
        size: 120,
        meta: {
            align: 'center',
        },
    },
]