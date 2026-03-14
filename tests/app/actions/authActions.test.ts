const mockVerifyUserCredentials = jest.fn()
const mockSetSessionCookie = jest.fn()
const mockClearSessionCookie = jest.fn()
const mockGetSessionUser = jest.fn()
const mockToSessionUser = jest.fn()

jest.mock('@/app/actions/userActions', () => ({
  verifyUserCredentials: (...args: unknown[]) => mockVerifyUserCredentials(...args),
}))

jest.mock('@/lib/auth/session', () => ({
  setSessionCookie: (...args: unknown[]) => mockSetSessionCookie(...args),
  clearSessionCookie: (...args: unknown[]) => mockClearSessionCookie(...args),
  getSessionUser: (...args: unknown[]) => mockGetSessionUser(...args),
  toSessionUser: (...args: unknown[]) => mockToSessionUser(...args),
}))

import {
  currentUserHasPermission,
  getCurrentSessionUser,
  login,
  loginFromFormState,
  logout,
} from '@/app/actions/authActions'

describe('authActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects blank credentials before checking the database', async () => {
    await expect(login('   ', '')).resolves.toEqual({
      success: false,
      message: 'Identifier and password are required',
    })

    expect(mockVerifyUserCredentials).not.toHaveBeenCalled()
  })

  it('returns invalid credentials when password verification fails', async () => {
    mockVerifyUserCredentials.mockResolvedValueOnce(null)

    await expect(login('4404', 'wrong')).resolves.toEqual({
      success: false,
      message: 'Invalid credentials',
    })
  })

  it('creates a session cookie when login succeeds', async () => {
    const safeUser = {
      ID: 10,
      UserTypeID: 1,
      EmployeeNumber: '4404',
      NetworkUserName: 'jdoe',
      DisplayName: 'John Doe',
      FullName: 'John Doe',
    }
    const sessionUser = {
      userId: 10,
      userTypeID: 1,
      employeeNumber: '4404',
      networkUserName: 'jdoe',
      displayName: 'John Doe',
      fullName: 'John Doe',
    }

    mockVerifyUserCredentials.mockResolvedValueOnce(safeUser)
    mockToSessionUser.mockReturnValueOnce(sessionUser)

    await expect(login(' 4404 ', 'Aw3s0me5auc3')).resolves.toEqual({
      success: true,
      user: sessionUser,
    })
    expect(mockVerifyUserCredentials).toHaveBeenCalledWith('4404', 'Aw3s0me5auc3')
    expect(mockSetSessionCookie).toHaveBeenCalledWith(sessionUser)
  })

  it('reads identifier and password from FormData for modal login submission', async () => {
    const safeUser = {
      ID: 10,
      UserTypeID: 1,
      EmployeeNumber: '4404',
      NetworkUserName: 'jdoe',
      DisplayName: 'John Doe',
      FullName: 'John Doe',
    }
    const sessionUser = {
      userId: 10,
      userTypeID: 1,
      employeeNumber: '4404',
      networkUserName: 'jdoe',
      displayName: 'John Doe',
      fullName: 'John Doe',
    }
    const formData = new FormData()

    formData.set('identifier', ' 4404 ')
    formData.set('password', 'Aw3s0me5auc3')

    mockVerifyUserCredentials.mockResolvedValueOnce(safeUser)
    mockToSessionUser.mockReturnValueOnce(sessionUser)

    await expect(loginFromFormState({ success: false }, formData)).resolves.toEqual({
      success: true,
      user: sessionUser,
    })
    expect(mockVerifyUserCredentials).toHaveBeenCalledWith('4404', 'Aw3s0me5auc3')
    expect(mockSetSessionCookie).toHaveBeenCalledWith(sessionUser)
  })

  it('clears the session cookie on logout', async () => {
    await logout()
    expect(mockClearSessionCookie).toHaveBeenCalledTimes(1)
  })

  it('returns the current session user', async () => {
    mockGetSessionUser.mockResolvedValueOnce({ userId: 10, userTypeID: 3 })

    await expect(getCurrentSessionUser()).resolves.toEqual({ userId: 10, userTypeID: 3 })
  })

  it('checks permissions for the current session user', async () => {
    mockGetSessionUser.mockResolvedValueOnce({ userId: 10, userTypeID: 3 })

    await expect(currentUserHasPermission('tickets.create')).resolves.toBe(true)
    await expect(currentUserHasPermission('programmingTasks.manage')).resolves.toBe(false)
  })
})

