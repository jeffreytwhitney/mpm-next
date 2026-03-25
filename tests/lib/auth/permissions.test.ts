beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

import {
  canAddTasksToTickets,
  canCreateTickets,
  canEditTicket,
  canManageProgrammingTasks,
  canManageServiceTickets,
  hasPermission,
  requireAuthenticatedUser,
  requirePermission,
  requireTicketEditPermission,
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

  it('denies nullish or missing user type values', () => {
    expect(hasPermission(null, 'tickets.create')).toBe(false)
    expect(hasPermission(undefined, 'tickets.create')).toBe(false)
    expect(hasPermission({ UserTypeID: null }, 'tickets.create')).toBe(false)
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

  it('returns the authenticated user when permission is granted', () => {
    const user = { UserTypeID: USER_TYPE_IDS.metrologyProgrammer }

    expect(requirePermission(user, 'tickets.create')).toBe(user)
  })

  it('allows both metrology user types to edit tickets across departments', () => {
    expect(canEditTicket({ UserTypeID: USER_TYPE_IDS.metrologyProgrammer, DepartmentID: 10 }, 25)).toBe(true)
    expect(
      canEditTicket({ UserTypeID: USER_TYPE_IDS.metrologyCalibrationTechnician, DepartmentID: 99 }, 25),
    ).toBe(true)
  })

  it('allows only same-department quality engineers to edit tickets', () => {
    expect(canEditTicket({ UserTypeID: USER_TYPE_IDS.qualityEngineer, DepartmentID: 25 }, 25)).toBe(true)
    expect(canEditTicket({ UserTypeID: USER_TYPE_IDS.qualityEngineer, DepartmentID: 24 }, 25)).toBe(false)
    expect(canEditTicket({ UserTypeID: USER_TYPE_IDS.qualityEngineer, DepartmentID: null }, 25)).toBe(false)
  })

  it('denies non-metrology non-quality roles from editing tickets', () => {
    expect(canEditTicket({ UserTypeID: USER_TYPE_IDS.manufacturingEngineer, DepartmentID: 25 }, 25)).toBe(false)
    expect(canEditTicket({ UserTypeID: USER_TYPE_IDS.cellLeader, DepartmentID: 25 }, 25)).toBe(false)
  })

  it('throws when an authenticated user lacks ticket edit permission', () => {
    expect(() =>
      requireTicketEditPermission({ UserTypeID: USER_TYPE_IDS.qualityEngineer, DepartmentID: 12 }, 25),
    ).toThrow('Permission denied: tickets.edit')
  })

  it('returns the user when ticket edit permission is granted', () => {
    const user = { UserTypeID: USER_TYPE_IDS.qualityEngineer, DepartmentID: 25 }

    expect(requireTicketEditPermission(user, 25)).toBe(user)
  })
})

