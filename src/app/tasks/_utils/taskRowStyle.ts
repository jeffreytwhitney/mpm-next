/**
 * AUTO-GENERATED MODULE DOC
 * App Router module for route composition and rendering.
 */
import React from 'react'
import {type TaskListItem} from '@/server/data/taskList'
import {getTaskRowStateFlags} from '@/features/tasks/taskRowState'
import {ROW_HIGHLIGHT_OPACITY} from '@/lib/filterConstants'

function makeRowHighlight(red: number, green: number, blue: number): React.CSSProperties {
    return {
        backgroundColor: `rgba(${red}, ${green}, ${blue}, ${ROW_HIGHLIGHT_OPACITY})`,
    }
}

export function getTaskRowStyle(task: TaskListItem): React.CSSProperties | undefined {
    const {isOverdue, isStarted, isWaiting, startedMoreThanMonthAgo} = getTaskRowStateFlags(task)

    if (isOverdue) return makeRowHighlight(255, 187, 187)
    if (isStarted && startedMoreThanMonthAgo) return makeRowHighlight(249, 115, 22)
    if (isStarted) return makeRowHighlight(22, 163, 74)
    if (isWaiting) return makeRowHighlight(37, 99, 235)

    return undefined
}

