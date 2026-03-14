import {
  canAddTasksToTickets,
  canCreateTickets,
  canManageProgrammingTasks,
  canManageServiceTickets,
  hasPermission,
  requireAuthenticatedUser,
  requirePermission,
} from '@/lib/auth/permissions'
import { USER_TYPE_IDS } from '@/lib/auth/roles'

describe('auth permissions', () => {
  it('gives metrology programmers access to all current mutation areas', () => {
    const user = { UserTypeID: USER_TYPE_IDS.metrologyProgrammer }

    expect(canManageProgrammingTasks(user)).toBe(true)
    expect(canManageServiceTickets(user)).toBe(true)
    expect(canCreateTickets(user)).toBe(true)
    expect(canAddTasksToTickets(user)).toBe(true)
  })

  it('allows metrology calibration technicians to manage only service tickets', () => {
    const user = { UserTypeID: USER_TYPE_IDS.metrologyCalibrationTechnician }

    expect(canManageServiceTickets(user)).toBe(true)
    expect(canManageProgrammingTasks(user)).toBe(false)
    expect(canCreateTickets(user)).toBe(false)
    expect(canAddTasksToTickets(user)).toBe(false)
  })

  it('allows quality engineers to create tickets and add tasks', () => {
    const user = { UserTypeID: USER_TYPE_IDS.qualityEngineer }

    expect(hasPermission(user, 'tickets.create')).toBe(true)
    expect(hasPermission(user, 'tickets.addTasks')).toBe(true)
    expect(hasPermission(user, 'programmingTasks.manage')).toBe(false)
    expect(hasPermission(user, 'serviceTickets.manage')).toBe(false)
  })

  it('denies manufacturing engineers and cell leaders by default', () => {
    expect(hasPermission({ UserTypeID: USER_TYPE_IDS.manufacturingEngineer }, 'tickets.create')).toBe(false)
    expect(hasPermission({ UserTypeID: USER_TYPE_IDS.cellLeader }, 'tickets.addTasks')).toBe(false)
  })

  it('grants full access only when an admin-eligible user has IsAdmin enabled', () => {
    const adminUser = {
      UserTypeID: USER_TYPE_IDS.metrologyCalibrationTechnician,
      IsAdmin: 1,
    }

    expect(hasPermission(adminUser, 'programmingTasks.manage')).toBe(true)
    expect(hasPermission(adminUser, 'tickets.create')).toBe(true)
    expect(hasPermission(adminUser, 'tickets.addTasks')).toBe(true)
    expect(hasPermission(adminUser, 'serviceTickets.manage')).toBe(true)
  })

  it('does not treat non-eligible user types as admins even when IsAdmin is set', () => {
    const notEligibleAdmin = {
      UserTypeID: USER_TYPE_IDS.qualityEngineer,
      IsAdmin: 1,
    }

    expect(hasPermission(notEligibleAdmin, 'programmingTasks.manage')).toBe(false)
    expect(hasPermission(notEligibleAdmin, 'serviceTickets.manage')).toBe(false)
    expect(hasPermission(notEligibleAdmin, 'tickets.create')).toBe(true)
  })

  it('requires authentication before permissions are evaluated', () => {
    expect(() => requireAuthenticatedUser(null)).toThrow('Authentication required')
    expect(() => requirePermission(null, 'tickets.create')).toThrow('Authentication required')
  })

  it('throws when an authenticated user lacks the required permission', () => {
    expect(() => requirePermission({ UserTypeID: USER_TYPE_IDS.manufacturingEngineer }, 'tickets.create')).toThrow(
      'Permission denied: tickets.create',
    )
  })
})

