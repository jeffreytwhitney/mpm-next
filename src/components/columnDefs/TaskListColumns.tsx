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
                <Link href={`/tasks/${taskId}`} className="text-[#0000EE] hover:underline font-semibold">
                    {ticketNumber || ''}
                </Link>
            )
        },
        size: 20,
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
                <Link href={`/tasks/${taskId}`} className="text-[#0000EE] hover:underline font-semibold">
                    {taskName ? taskName.slice(0, 30) : ''}
                </Link>
            )
        },
        size: 50,
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
        size: 50,
        meta: {
            align: 'left',
        },
    },
    {
        accessorKey: 'CurrentlyRunning',
        header: () => (
            <div className="leading-tight text-center">
                <div>Cur</div>
                <div>Run</div>
            </div>
        ),
        cell: ({row}) => <div>{row.getValue('CurrentlyRunning')}</div>,
        size: 5,
        minSize: 5,
        meta: {
            align: 'center',
        },
    },
    {
        accessorKey: 'ManufacturingRev',
        header: () => (
            <div className="leading-tight text-center">
                <div>Mfg</div>
                <div>Rev</div>
            </div>
        ),
        cell: ({row}) => <div>{row.getValue('ManufacturingRev') || ''}</div>,
        size: 5,
        minSize: 5,
        meta: {
            align: 'center',
        },
    },
    {
        accessorKey: 'Status',
        header: 'Status',
        cell: ({row}) => <div>{row.getValue('Status') || ''}</div>,
        size: 30,
        meta: {
            align: 'left',
        },
    },
    {
        accessorKey: 'Operation',
        header: () => (
            <div className="leading-tight text-center">
                <div>Op</div>
                <div>Nbr</div>
            </div>
        ),
        cell: ({row}) => <div>{row.getValue('Operation') || ''}</div>,
        size: 5,
        minSize: 5,
        meta: {
            align: 'center',
        },
    },
    {
        accessorKey: 'DueDate',
        header: 'Due Date',
        cell: ({ row }) => {
            const dueDate = row.getValue('DueDate') as Date | null
            return <div>{dueDate ? dueDate.toLocaleDateString() : ''}</div>
        }
        ,
        size: 30,
        meta: {
            align: 'center',
        },
    },
    {
        accessorKey: 'ScheduledDueDate',
        header: 'Sched. Due Date',
        cell: ({ row }) => {
            const schedDueDate = row.getValue('ScheduledDueDate') as Date | null
            return <div>{schedDueDate ? schedDueDate.toLocaleDateString() : '--'}</div>
        }
        ,
        size: 30,
        meta: {
            align: 'center',
        },
    },
]