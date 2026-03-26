'use client';

/**
 * AUTO-GENERATED MODULE DOC
 * Shared UI component module for 'AdminNavLinks'.
 */
import {
    UsersIcon,
    BuildingOfficeIcon,
    MapPinIcon,
    CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const adminLinks = [
    { name: 'Users',       href: '/admin/users',       icon: UsersIcon },
    { name: 'Departments', href: '/admin/departments',  icon: BuildingOfficeIcon },
    { name: 'Sites',       href: '/admin/sites',        icon: MapPinIcon },
    { name: 'Schedules',   href: '/admin/schedules',    icon: CalendarDaysIcon },
];

export default function AdminNavLinks() {
    const pathname = usePathname();
    return (
        <>
            {adminLinks.map((link) => {
                const LinkIcon = link.icon;
                return (
                    <Link
                        key={link.name}
                        href={link.href}
                        className={clsx(
                            'flex h-12 grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3',
                            {
                                'bg-sky-100 text-blue-600': pathname.startsWith(link.href),
                            },
                        )}
                    >
                        <LinkIcon className="w-5" />
                        <p className="hidden md:block">{link.name}</p>
                    </Link>
                );
            })}
        </>
    );
}

