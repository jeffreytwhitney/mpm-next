'use client'

/**
 * AUTO-GENERATED MODULE DOC
 * App Router module for route composition and rendering.
 */
import React from 'react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import SlideOverShell from '@/components/ui/SlideOverShell'

/** Fired by the form after a successful save so the shell can close itself. */
const TICKET_DETAIL_SAVED_EVENT = 'ticket-detail:saved'
/** Fired when child flows need the detail view to re-fetch server data. */
const TICKET_DETAIL_REFRESH_EVENT = 'ticket-detail:refresh'

/** UI shell props for rendering ticket detail in a slide-over panel. */
interface TicketDetailModalShellProps {
  children: React.ReactNode
  title: string
  panelWidthClassName?: string
}

/**
 * Client shell used by the intercepted modal route.
 *
 * It owns close/navigation behavior and listens for cross-component
 * events emitted by child forms.
 */
export default function TicketDetailModalShell({
  children,
  title,
  panelWidthClassName,
}: TicketDetailModalShellProps) {
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
    <SlideOverShell
      title={title}
      onClose={closeModal}
      closeAriaLabel="Close ticket details"
      panelWidthClassName={panelWidthClassName}
    >
      {children}
    </SlideOverShell>
  )
}

