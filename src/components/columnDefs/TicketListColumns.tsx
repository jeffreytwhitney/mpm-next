// Column definitions for the ticket list table
import {ColumnDef} from "@tanstack/react-table";
import {TicketListItem} from "@/server/data/ticketList";
import React from "react";
import Link from 'next/link'

const ticketLinkClassName = "text-[#0E7490] hover:text-[#155E75] hover:underline font-semibold transition-colors"

export const ticketColumns: ColumnDef<TicketListItem>[] = [
    {
        accessorKey: 'TicketNumber',
        header: 'Ticket Nbr',
        cell: ({row}) => {
            const ticketNumber = row.getValue('TicketNumber') as string | null
            const projectId = row.original.ID
            return (
                <Link href={`/tickets/${projectId}`} className={ticketLinkClassName}>
                    {ticketNumber || ''}
                </Link>
            )
        },
        size: 15,
        minSize:15,
        meta: {
            align: 'center',
        },
    },
    {
        accessorKey: 'ProjectName',
        header: 'Ticket Name',
        cell: ({row}) => {
            const projectName = row.getValue('ProjectName') as string | null
            const projectId = row.original.ID

            return (
                <Link href={`/tickets/${projectId}`} className={ticketLinkClassName}>
                    {projectName ? projectName.slice(0, 25) : ''}
                </Link>
            )
        },
        size: 30,
        meta: {
            align: 'left',
        },
    },
    {
        accessorKey: 'ProjectDescription',
        header: 'Description',
        cell: ({row}) => {
            const projectDescription = row.getValue('ProjectDescription') as string | null
            return <div>{projectDescription ? projectDescription.slice(0, 150) : ''}</div>
        },
        size: 150,
        meta: {
            align: 'left',
        },
    },
    {
        accessorKey: 'DepartmentName',
        header: 'Department',
        cell: ({row}) => <div>{row.getValue('DepartmentName') || ''}</div>,
        size: 15,
        minSize: 15,
        meta: {
            align: 'left',
        },
    },
    {
        accessorKey: 'CountOfActiveTasks',
        header: 'Active Tasks',
        cell: ({row}) => <div>{row.getValue('CountOfActiveTasks') || ''}</div>,
        minSize: 15,
        size: 15,
        meta: {
            align: 'left',
        },
    },
    {
        accessorKey: 'PrimaryOwnerName',
        header: 'Manf. Engineer',
        cell: ({row}) => <div>{row.getValue('PrimaryOwnerName') || ''}</div>,
        size: 20,
        minSize: 20,
        meta: {
            align: 'left',
        },
    },
    {
        accessorKey: 'SecondaryOwnerName',
        header: 'Quality Engineer',
        cell: ({row}) => <div>{row.getValue('SecondaryOwnerName') || ''}</div>,
        size: 20,
        minSize: 20,
        meta: {
            align: 'left',
        },
    },
    {
        accessorKey: 'InitiatorName',
        header: 'Submittor',
        cell: ({row}) => <div>{row.getValue('InitiatorName') || ''}</div>,
        size: 20,
        minSize: 20,
        meta: {
            align: 'left',
        },
    },
    {
        accessorKey: 'CreatedTimestamp',
        header: 'Create Date',
        cell: ({ row }) => {
            const createDate = row.getValue('CreatedTimestamp') as Date | null
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