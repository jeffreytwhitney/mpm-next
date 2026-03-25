'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import SlideOverShell from '@/components/ui/SlideOverShell'

const TICKET_DETAIL_SAVED_EVENT = 'ticket-detail:saved'
const TICKET_DETAIL_REFRESH_EVENT = 'ticket-detail:refresh'

interface TicketDetailModalShellProps {
  children: React.ReactNode
  title: string
}

export default function TicketDetailModalShell({ children, title }: TicketDetailModalShellProps) {
  const router = useRouter()

  const closeModal = useCallback(() => {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push('/tickets')
  }, [router])

  useEffect(() => {
    const handleTicketSaved = () => {
      closeModal()
    }

    const handleTicketRefresh = () => {
      router.refresh()
    }

    window.addEventListener(TICKET_DETAIL_SAVED_EVENT, handleTicketSaved)
    window.addEventListener(TICKET_DETAIL_REFRESH_EVENT, handleTicketRefresh)

    return () => {
      window.removeEventListener(TICKET_DETAIL_SAVED_EVENT, handleTicketSaved)
      window.removeEventListener(TICKET_DETAIL_REFRESH_EVENT, handleTicketRefresh)
    }
  }, [closeModal, router])

  return (
    <SlideOverShell title={title} onClose={closeModal} closeAriaLabel="Close ticket details">
      {children}
    </SlideOverShell>
  )
}

