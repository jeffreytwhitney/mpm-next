'use client'

import React, { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import SlideOverShell from '@/components/ui/SlideOverShell'

interface TicketChildSlideOverShellProps {
  children: React.ReactNode
  title: string
}

export default function TicketChildSlideOverShell({ children, title }: TicketChildSlideOverShellProps) {
  const router = useRouter()

  const closeModal = useCallback(() => {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push('/tickets')
  }, [router])

  return (
    <SlideOverShell
      title={title}
      onClose={closeModal}
      closeAriaLabel="Close task group editor"
      side="left"
      zIndexClassName="z-60"
    >
      {children}
    </SlideOverShell>
  )
}


