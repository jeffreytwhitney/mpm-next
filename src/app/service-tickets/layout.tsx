import React from 'react'
import {Header} from '@/components/Header'
import {SideNav} from '@/components/SideNav'

interface ServiceTicketsLayoutProps {
    children: React.ReactNode
}

export default function ServiceTicketsLayout({children}: ServiceTicketsLayoutProps) {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <div className="flex min-h-[calc(100vh-57px)]">
                <SideNav />
                <main className="min-w-0 flex-1">
                    {children}
                </main>
            </div>
        </div>
    )
}

