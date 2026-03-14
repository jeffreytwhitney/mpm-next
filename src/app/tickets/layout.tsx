import React from 'react'
import {Header} from '@/components/Header'
import {SideNav} from '@/components/SideNav'
import {getSessionUser} from '@/lib/auth/session'

interface TicketsLayoutProps {
    children: React.ReactNode
}

export default async function TicketsLayout({children}: TicketsLayoutProps) {
    const sessionUser = await getSessionUser()
    const isAdmin = sessionUser?.isAdmin === true

    return (
        <div className="min-h-screen bg-white">
            <Header />
            <div className="flex min-h-[calc(100vh-57px)]">
                <SideNav isAdmin={isAdmin} />
                <main className="min-w-0 flex-1">
                    {children}
                </main>
            </div>
        </div>
    )
}

