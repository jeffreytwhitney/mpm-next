beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

import {parseDateValue, startOfDay} from '@/lib/date'

describe('date utilities', () => {
  describe('parseDateValue', () => {
    it('returns null for undefined and null', () => {
      expect(parseDateValue(undefined)).toBeNull()
      expect(parseDateValue(null)).toBeNull()
    })

    it('returns a Date for valid strings and numbers', () => {
      expect(parseDateValue('2026-03-13')).toBeInstanceOf(Date)
      expect(parseDateValue(1710288000000)).toBeInstanceOf(Date)
    })

    it('returns null for invalid date values', () => {
      expect(parseDateValue('not-a-date')).toBeNull()
      expect(parseDateValue({})).toBeNull()
    })
  })

  describe('startOfDay', () => {
    it('normalizes time to midnight', () => {
      const normalized = startOfDay(new Date('2026-03-13T15:42:10.500Z'))

      expect(normalized.getHours()).toBe(0)
      expect(normalized.getMinutes()).toBe(0)
      expect(normalized.getSeconds()).toBe(0)
      expect(normalized.getMilliseconds()).toBe(0)
    })

    it('does not mutate the original date object', () => {
      const original = new Date('2026-03-13T15:42:10.500Z')
      const originalTime = original.getTime()

      const normalized = startOfDay(original)

      expect(original.getTime()).toBe(originalTime)
      expect(normalized).not.toBe(original)
    })
  })
})

