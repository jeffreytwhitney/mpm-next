/**
 * AUTO-GENERATED MODULE DOC
 * App Router page module for '/tasks'.
 */
import {TaskListClient} from './TaskListClient';
import {getTaskList, parseTaskListFilters} from '@/server/data/queries/taskList';
import type {TaskListSearchParams} from '@/server/data/queries/taskList';
import {getTaskStatusDropdownOptions} from "@/server/data/taskStatus";
import {getTaskTypeDropdownOptions} from '@/server/data/taskType';
import {getMetrologyUserDropdownOptions} from '@/server/data/user';
import {getTopLevelDepartmentDropdownOptions} from '@/server/data/department'
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
    const [{tasks, totalCount}, statusOptions, taskTypeOptions, assigneeOptions, departmentOptions] = await Promise.all([
        getTaskList(filters),
        getTaskStatusDropdownOptions(),
        getTaskTypeDropdownOptions(),
        getMetrologyUserDropdownOptions(Number(filters.siteID) || 1),
        getTopLevelDepartmentDropdownOptions(Number(filters.siteID) || 1),
    ])


    return (
        <TaskListClient
            initialTasks={tasks}
            initialFilters={filters}
            initialStatusOptions={statusOptions}
            initialTaskTypeOptions={taskTypeOptions}
            initialAssigneeOptions={assigneeOptions}
            initialDepartmentOptions={departmentOptions}
            totalCount={totalCount}
        />
    )
}
