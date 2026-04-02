import {requireCurrentUser} from '@/lib/auth/currentUser'
import {getDepartmentDropdownOptions} from '@/server/data/department'
import {getTaskTypeDropdownOptions} from '@/server/data/taskType'
import {
    getQualityEngineerDropdownOptions,
    getManufacturingEngineerDropdownOptions,
} from '@/server/data/user'
import {USER_TYPE_IDS} from '@/lib/auth/roles'
import AddNewTicketForm from './AddNewTicketForm'

/**
 * Server-side data loader for the new ticket form.
 *
 * Fetches department and task type dropdown options scoped to the
 * current user's site. For Quality Engineers, also pre-fetches engineer
 * options for their assigned department so the form is hydrated on load.
 */
export async function AddNewTicketContent() {
    const currentUser = await requireCurrentUser()

    const siteID = currentUser.siteID ?? 1

    const [departmentOptions, taskTypeOptions] = await Promise.all([
        getDepartmentDropdownOptions(siteID),
        getTaskTypeDropdownOptions(),
    ])

    const isQualityEngineer = currentUser.userType === USER_TYPE_IDS.qualityEngineer
    const preloadDepartmentID =
        isQualityEngineer && currentUser.departmentID != null && currentUser.departmentID > 0
            ? currentUser.departmentID
            : 0

    const [initialQualityEngineerOptions, initialManufacturingEngineerOptions] =
        preloadDepartmentID > 0
            ? await Promise.all([
                getQualityEngineerDropdownOptions(preloadDepartmentID),
                getManufacturingEngineerDropdownOptions(preloadDepartmentID),
            ])
            : [[], []]

    return (
        <AddNewTicketForm
            departmentOptions={departmentOptions}
            taskTypeOptions={taskTypeOptions}
            currentUser={currentUser}
            initialQualityEngineerOptions={initialQualityEngineerOptions}
            initialManufacturingEngineerOptions={initialManufacturingEngineerOptions}
        />
    )
}

