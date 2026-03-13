import {TaskListClient} from './TaskListClient';
import {getTaskList, parseTaskListFilters} from '@/app/actions/taskListActions';
import type {TaskListSearchParams} from '@/app/actions/taskListActions';
import {getTaskStatusDropdownOptions} from "@/app/actions/taskStatusActions";
import {getTaskTypeDropdownOptions} from '@/app/actions/taskTypeActions';
import {getMetrologyUserDropdownOptions} from '@/app/actions/userActions';


interface TaskListPageProps {
    searchParams: TaskListSearchParams
}

export default async function TaskListPage({searchParams}: TaskListPageProps) {
    // Await searchParams Promise
    const params = await searchParams
    const filters = parseTaskListFilters(params)

    // Fetch data on the server with filters from URL
    const [tasks, statusOptions, taskTypeOptions, assigneeOptions] = await Promise.all([
        getTaskList(filters),
        getTaskStatusDropdownOptions(),
        getTaskTypeDropdownOptions(),
        getMetrologyUserDropdownOptions(1),
    ])


    return (
        <TaskListClient
            initialTasks={tasks}
            initialFilters={filters}
            initialStatusOptions={statusOptions}
            initialTaskTypeOptions={taskTypeOptions}
            initialAssigneeOptions={assigneeOptions}
        />
    )
}
