import React from 'react'

interface TasksLayoutProps {
  children: React.ReactNode
  modal: React.ReactNode
  params: Promise<Record<string, never>>
}

export default function TasksLayout({ children, modal }: TasksLayoutProps) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}
