import {notFound} from 'next/navigation'
import {getTaskById} from '@/server/data/task'
import {getProjectById} from '@/server/data/project'
import {getTaskStatusDropdownOptions} from '@/server/data/taskStatus'
import {getCurrentUser} from '@/lib/auth/currentUser'
import {USER_TYPE_IDS} from '@/lib/auth/roles'
import {TaskDetailForm} from '@/app/tasks/_components/TaskDetailForm'

interface TaskDetailContentProps {
    taskId: number
}

export async function TaskDetailContent({taskId}: TaskDetailContentProps) {
    const task = await getTaskById(taskId)
    const currentUser = await getCurrentUser()

    if (!task) {
        notFound()
    }

    const [project, statusOptions] = await Promise.all([
        task.ProjectID != null ? getProjectById(task.ProjectID) : null,
        getTaskStatusDropdownOptions(),
    ])

    if (!project) {
        notFound()
    }

    const isMetrologyProgrammer = currentUser?.userType === USER_TYPE_IDS.metrologyProgrammer
    const isQualityEngineerInDept =
        currentUser?.userType === USER_TYPE_IDS.qualityEngineer &&
        currentUser.departmentID != null &&
        currentUser.departmentID === project.DepartmentID
    const isClosedStatus = task.StatusID === 4 || task.StatusID === 5
    const canSubmit = (isMetrologyProgrammer || isQualityEngineerInDept) && !isClosedStatus

    return (
        <TaskDetailForm
            taskId={taskId}
            task={task}
            project={project}
            statusOptions={statusOptions}
            canSubmit={canSubmit}
            isMetrologyProgrammer={isMetrologyProgrammer}
        />
    )
}
