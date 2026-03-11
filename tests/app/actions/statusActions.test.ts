const mockFindManyStatus = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tblStatus: {
      findMany: mockFindManyStatus,
    },
  },
}))

import { getTaskStatusOptions } from '@/app/actions/statusActions'

describe('statusActions', () => {
  it('maps statuses to value/label options and filters invalid labels', async () => {
    mockFindManyStatus.mockResolvedValueOnce([
      { ID: 1, Status: 'Open' },
      { ID: 2, Status: '' },
      { ID: 3, Status: null },
      { ID: 4, Status: 'Closed' },
    ])

    const result = await getTaskStatusOptions()

    expect(mockFindManyStatus).toHaveBeenCalledWith({
      select: { ID: true, Status: true },
      orderBy: { ID: 'asc' },
    })
    expect(result).toEqual([
      { value: 1, label: 'Open' },
      { value: 4, label: 'Closed' },
    ])
  })

  it('throws a consistent error when status query fails', async () => {
    mockFindManyStatus.mockRejectedValueOnce(new Error('db fail'))

    await expect(getTaskStatusOptions()).rejects.toThrow('Failed to fetch task status options')
  })
})

