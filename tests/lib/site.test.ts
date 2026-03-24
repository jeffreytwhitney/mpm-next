beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

import {parseSiteID, resolveSiteID} from '@/lib/site'

describe('site helpers', () => {
  it('accepts known site IDs only', () => {
    expect(parseSiteID('1')).toBe('1')
    expect(parseSiteID('2')).toBe('2')
    expect(parseSiteID('3')).toBeUndefined()
    expect(parseSiteID(undefined)).toBeUndefined()
  })

  it('resolves URL > cookie > default', () => {
    expect(resolveSiteID('2', '1')).toBe('2')
    expect(resolveSiteID(undefined, '2')).toBe('2')
    expect(resolveSiteID(undefined, undefined)).toBe('1')
  })
})

