'use client'
import React, {useActionState} from 'react'
import { useRouter } from 'next/navigation'
import {createTicket} from '@/features/tickets/actions/addTicketAction'

import {
    INITIAL_CREATE_TICKET_STATE,
    type CreateTicketFieldErrors,
} from '@/features/tickets/actions/ticketActionTypes'

