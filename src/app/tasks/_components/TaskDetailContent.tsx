import {notFound} from 'next/navigation'
import {getTaskDetailById} from '@/server/data/taskDetail'
import {getTaskStatusDropdownOptions} from '@/server/data/taskStatus'
import {getMetrologyProgrammerDropdownOptions} from '@/server/data/user'
import {getCurrentUser} from '@/lib/auth/currentUser'
import {USER_TYPE_IDS} from '@/lib/auth/roles'
import {TaskDetailForm} from '@/app/tasks/_components/TaskDetailForm'

interface TaskDetailContentProps {
    taskId: number
}

export async function TaskDetailContent({taskId}: TaskDetailContentProps) {
    const [taskDetail, currentUser, statusOptions, assigneeOptions] = await Promise.all([
        getTaskDetailById(taskId),
        getCurrentUser(),
        getTaskStatusDropdownOptions(),
        getMetrologyProgrammerDropdownOptions()
    ])

    if (!taskDetail) {
        notFound()
    }

    const isMetrologyProgrammer = currentUser?.userType === USER_TYPE_IDS.metrologyProgrammer
    const isProjectQualityEngineer =
        currentUser?.userType === USER_TYPE_IDS.qualityEngineer &&
        currentUser.userId === taskDetail.project.SecondaryProjectOwnerID
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
        />
    )
}
