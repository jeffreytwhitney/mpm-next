'use client'

import React from 'react'
import {useRouter} from 'next/navigation'
import {useCallback, useEffect} from 'react'
import SlideOverShell from '@/components/ui/SlideOverShell'

const NEW_TICKET_SAVED_EVENT = 'ticket-new:saved'

interface NewTicketModalShellProps {
    children: React.ReactNode
    title: string
    panelWidthClassName?: string
}


export default function NewTicketModalShell({
                                                children,
                                                title,
                                                panelWidthClassName,
                                            }: NewTicketModalShellProps) {
    const router = useRouter()

    const closeModal = useCallback(() => {
        router.push('/tickets')
    }, [router])

    useEffect(() => {
        const handleTicketSaved = () => {
            closeModal()
        }
        window.addEventListener(NEW_TICKET_SAVED_EVENT, handleTicketSaved)

        return () => {
            window.removeEventListener(NEW_TICKET_SAVED_EVENT, handleTicketSaved)
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