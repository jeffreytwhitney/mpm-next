// Column definitions for the task list table
import {ColumnDef} from "@tanstack/react-table";
import type {TaskListItem} from "@/server/data/taskList";
import React from "react";
import Link from 'next/link'

const taskLinkClassName = "text-[#0E7490] hover:text-[#155E75] hover:underline font-semibold transition-colors"

export const ticketDetailTaskColumns: ColumnDef<TaskListItem>[] = [

    {
        accessorKey: 'TaskName',
        header: 'Part/Task Name',
        cell: ({row}) => {
            const taskName = row.getValue('TaskName') as string | null
            const taskId = row.original.ID
            const ticketId = row.original.ProjectID
            return (
                <Link href={`/tickets/${ticketId}/tasks/${taskId}`} className={taskLinkClassName}>
                    {taskName ? taskName.slice(0, 30) : ''}
                </Link>
            )
        },
        size: 30,
        meta: {
            align: 'left',
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
        cell: ({row}) => {
            const revValue = row.getValue('ManufacturingRev') as string | null;
            return (
                <div>{revValue ? revValue.slice(0, 4) : ''}</div>
            )

        },
        size: 7,
        minSize: 7,
        meta: {
            align: 'center',
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
        size: 7,
        minSize: 7,
        meta: {
            align: 'center',
        },
    },
    {
        accessorKey: 'TaskType',
        header: 'Task Type',
        cell: ({row}) => <div>{row.getValue('TaskType') || ''}</div>,
        minSize: 15,
        size: 15,
        meta: {
            align: 'left',
        },
    },
    {
        accessorKey: 'AssignedToName',
        header: 'Assigned To',
        cell: ({row}) => <div>{row.getValue('AssignedToName') || ''}</div>,
        size: 20,
        meta: {
            align: 'left',
        },
    },
    {
        accessorKey: 'Status',
        header: 'Status',
        cell: ({row}) => <div>{row.getValue('Status') || ''}</div>,
        size: 15,
        minSize: 15,
        meta: {
            align: 'left',
        },
    },
    {
        accessorKey: 'ManualDueDate',
        header: () => (
            <div className="leading-tight text-center">
                <div>Man</div>
                <div>Dt</div>
            </div>
        ),
        cell: ({row}) => {
            const manualDueDate = row.getValue('ManualDueDate')
            const isChecked = manualDueDate === 1 || manualDueDate === '1' || manualDueDate === true

            return (
                <input
                    type="checkbox"
                    checked={isChecked}
                    disabled
                    readOnly
                    aria-label="Manual due date"
                />
            )
        },
        size: 5,
        minSize: 5,
        meta: {
            align: 'center',
            sortable: false,
        },
    },
    {
        accessorKey: 'IsInSchedule',
        header: () => (
            <div className="leading-tight text-center">
                <div>In</div>
                <div>Sched</div>
            </div>
        ),
        cell: ({row}) => <div>{row.getValue('IsInSchedule') || ''}</div>,
        size: 7,
        minSize: 7,
        meta: {
            align: 'center',
            sortable: false,
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
        size: 15,
        minSize: 15,
        meta: {
            align: 'center',
        },
    },
    {
        accessorKey: 'ScheduledDueDate',
        header: 'Sched. Due Date',
        cell: ({ row }) => {
            const schedDueDate = row.getValue('ScheduledDueDate') as Date | null
            return <div>{schedDueDate ? schedDueDate.toLocaleDateString() : ''}</div>
        }
        ,
        size: 15,
        minSize: 15,
        meta: {
            align: 'center',
        },
    },

    {
        accessorKey: 'SumOfHours',
        header: () => (
            <div className="leading-tight text-center">
                <div>Tot</div>
                <div>Hrs</div>
            </div>
        ),
        cell: ({row}) => <div>{row.getValue('SumOfHours') || ''}</div>,
        size: 5,
        minSize: 5,
        meta: {
            align: 'center',
        },
    },
    {
        accessorKey: 'DateCompleted',
        header: 'Date Completed',
        cell: ({ row }) => {
            const createDate = row.getValue('DateCompleted') as Date | null
            return <div>{createDate ? createDate.toLocaleDateString() : ''}</div>
        }
        ,
        size: 15,
        minSize: 15,
        meta: {
            align: 'left',
        },
    },
]

// Backwards-compatible alias while callers migrate from the misspelled export.
export const ticketDeailTaskColumns = ticketDetailTaskColumns
