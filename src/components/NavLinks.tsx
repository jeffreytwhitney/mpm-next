'use client';
import {
    WrenchScrewdriverIcon,
    ClipboardDocumentListIcon,
    TicketIcon,
    ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const links = [
    { name: 'Service Tickets', href: '/service-tickets', icon: WrenchScrewdriverIcon },
    { name: 'Tasks',           href: '/tasks',           icon: ClipboardDocumentListIcon },
    { name: 'Tickets',         href: '/tickets',         icon: TicketIcon },
    { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCartIcon },
];



export default function NavLinks() {
    const pathname = usePathname();
    return (
        <>
            {links.map((link) => {
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
                        <LinkIcon className="w-6" />
                        <p className="hidden md:block">{link.name}</p>
                    </Link>
                );
            })}
        </>
    );
}
