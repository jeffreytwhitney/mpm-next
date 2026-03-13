import React from 'react'
import {Header} from '@/components/Header'
import {SideNav} from '@/components/SideNav'

interface TasksLayoutProps {
  children: React.ReactNode
  modal: React.ReactNode
  params: Promise<Record<string, never>>
}

export default function TasksLayout({ children, modal }: TasksLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="flex min-h-[calc(100vh-57px)]">
        <SideNav />
        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
      {modal}
    </div>
  )
}
