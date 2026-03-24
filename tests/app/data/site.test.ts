beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

const mockSetCookie = jest.fn()

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    set: mockSetCookie,
  })),
}))

import {setCurrentSiteCookie} from '@/server/data/site'
import {SITE_COOKIE_NAME} from '@/lib/site'

describe('siteActions', () => {
  beforeEach(() => {
    mockSetCookie.mockReset()
  })

  it('sets a cookie for a valid site ID', async () => {
    await setCurrentSiteCookie('2')

    expect(mockSetCookie).toHaveBeenCalledWith(
      expect.objectContaining({
        name: SITE_COOKIE_NAME,
        value: '2',
        path: '/',
        sameSite: 'lax',
      }),
    )
  })

  it('throws for invalid site IDs', async () => {
    await expect(setCurrentSiteCookie('99')).rejects.toThrow('Invalid site ID')
    expect(mockSetCookie).not.toHaveBeenCalled()
  })
})

