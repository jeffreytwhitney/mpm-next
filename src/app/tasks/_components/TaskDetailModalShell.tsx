'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import SlideOverShell from '@/components/ui/SlideOverShell'

const TASK_DETAIL_SAVED_EVENT = 'task-detail:saved'
const TASK_DETAIL_REFRESH_EVENT = 'task-detail:refresh'

interface TaskDetailModalShellProps {
  children: React.ReactNode
  title: string
}

export default function TaskDetailModalShell({ children, title }: TaskDetailModalShellProps) {
  const router = useRouter()

  const closeModal = useCallback(() => {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push('/tasks')
  }, [router])

  useEffect(() => {
    const handleTaskSaved = () => {
      closeModal()
    }

    const handleTaskRefresh = () => {
      router.refresh()
    }

    window.addEventListener(TASK_DETAIL_SAVED_EVENT, handleTaskSaved)
    window.addEventListener(TASK_DETAIL_REFRESH_EVENT, handleTaskRefresh)

    return () => {
      window.removeEventListener(TASK_DETAIL_SAVED_EVENT, handleTaskSaved)
      window.removeEventListener(TASK_DETAIL_REFRESH_EVENT, handleTaskRefresh)
    }
  }, [closeModal, router])

  return (
    <SlideOverShell title={title} onClose={closeModal} closeAriaLabel="Close task details">
      {children}
    </SlideOverShell>
  )
}

