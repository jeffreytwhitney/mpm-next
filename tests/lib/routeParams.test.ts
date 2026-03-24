import { parsePositiveIntParamOrNotFound } from '@/lib/routeParams'
import { notFound } from 'next/navigation'

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

describe('route params utilities', () => {
  it('parses a valid id param', async () => {
    await expect(
      parsePositiveIntParamOrNotFound(Promise.resolve({ id: '42' }))
    ).resolves.toBe(42)

    expect(notFound).not.toHaveBeenCalled()
  })

  it('supports custom param keys', async () => {
    await expect(
      parsePositiveIntParamOrNotFound(
        Promise.resolve({ ticketId: '8' }),
        'ticketId'
      )
    ).resolves.toBe(8)
  })

  it('throws notFound for non-integer or non-positive values', async () => {
    await expect(
      parsePositiveIntParamOrNotFound(Promise.resolve({ id: 'abc' }))
    ).rejects.toThrow('NEXT_NOT_FOUND')

    await expect(
      parsePositiveIntParamOrNotFound(Promise.resolve({ id: '0' }))
    ).rejects.toThrow('NEXT_NOT_FOUND')

    expect(notFound).toHaveBeenCalledTimes(2)
  })
})
