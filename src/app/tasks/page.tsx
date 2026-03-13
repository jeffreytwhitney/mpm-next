import {TaskListClient} from './TaskListClient';
import {getTaskList, parseTaskListFilters} from '@/app/actions/taskListActions';
import type {TaskListSearchParams} from '@/app/actions/taskListActions';
import {getTaskStatusDropdownOptions} from "@/app/actions/taskStatusActions";
import {getTaskTypeDropdownOptions} from '@/app/actions/taskTypeActions';
import {getMetrologyUserDropdownOptions} from '@/app/actions/userActions';
import {cookies} from 'next/headers';
import {resolveSiteID, SITE_COOKIE_NAME} from '@/lib/site';


interface TaskListPageProps {
    searchParams: TaskListSearchParams
}

export default async function TaskListPage({searchParams}: TaskListPageProps) {
    const params = await searchParams
    const cookieStore = await cookies()
    const cookieSiteID = cookieStore.get(SITE_COOKIE_NAME)?.value
    const defaultSiteID = resolveSiteID(undefined, cookieSiteID)
    const filters = parseTaskListFilters(params, defaultSiteID)

    // Fetch data on the server with filters from URL
    const [tasks, statusOptions, taskTypeOptions, assigneeOptions] = await Promise.all([
        getTaskList(filters),
        getTaskStatusDropdownOptions(),
        getTaskTypeDropdownOptions(),
        getMetrologyUserDropdownOptions(Number(filters.siteID) || 1),
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
