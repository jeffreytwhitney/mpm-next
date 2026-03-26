/**
 * AUTO-GENERATED MODULE DOC
 * Feature module for 'tasks' domain behavior.
 */
import {notFound} from 'next/navigation'
import {getTaskDetailById} from '@/server/data/queries/taskDetail'
import {getTaskStatusDropdownOptions} from '@/server/data/taskStatus'
import {getMetrologyProgrammerDropdownOptions} from '@/server/data/user'
import {getCurrentUser} from '@/lib/auth/currentUser'
import {USER_TYPE_IDS} from '@/lib/auth/roles'
import {TaskDetailForm} from '@/features/tasks/components/TaskDetailForm'
import { getTaskNotesByTaskID } from '@/server/data/taskNote'

interface TaskDetailContentProps {
    taskId: number
    detailBasePath?: string
}

export async function TaskDetailContent({taskId, detailBasePath}: TaskDetailContentProps) {
    const [taskDetail, currentUser, statusOptions, assigneeOptions, taskNotes] = await Promise.all([
        getTaskDetailById(taskId),
        getCurrentUser(),
        getTaskStatusDropdownOptions(),
        getMetrologyProgrammerDropdownOptions(),
        getTaskNotesByTaskID(taskId),
    ])

    if (!taskDetail) {
        notFound()
    }

    const isMetrologyProgrammer = currentUser?.userType === USER_TYPE_IDS.metrologyProgrammer
    const isProjectQualityEngineer =
        currentUser?.userType === USER_TYPE_IDS.qualityEngineer &&
        currentUser.userId === taskDetail.ticket.SecondaryProjectOwnerID
    const isClosedStatus = taskDetail.task.StatusID === 4 || taskDetail.task.StatusID === 5
    const canSubmit = (isMetrologyProgrammer || isProjectQualityEngineer) && !isClosedStatus

    return (
        <TaskDetailForm
            taskId={taskId}
            taskDetail={taskDetail}
            statusOptions={statusOptions}
            assigneeOptions={assigneeOptions}
            canSubmit={canSubmit}
            isMetrologyProgrammer={isMetrologyProgrammer}
            taskNotes={taskNotes}
            detailBasePath={detailBasePath}
        />
    )
}

