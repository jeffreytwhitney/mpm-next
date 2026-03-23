import React from 'react'
import { Header } from '@/components/Header'
import { SideNav } from '@/components/SideNav'
import { getSessionUser } from '@/lib/auth/session'

interface AppShellLayoutProps {
  children: React.ReactNode
  modal?: React.ReactNode
  child?: React.ReactNode
}

export default async function AppShellLayout({
  children,
  modal,
  child,
}: AppShellLayoutProps) {
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
      {modal}
      {child}
    </div>
  )
}

