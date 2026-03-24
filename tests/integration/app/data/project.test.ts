import {
  getTicketById
} from '@/server/data/ticket'
import {prisma} from '@/lib/prisma'

describe('Ticket Actions', () => {

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('gets an existing ticket by ID and throws for a missing ID', async () => {
    const firstProject = await prisma.tblProject.findFirst({
      select: {ID: true},
      orderBy: {ID: 'asc'},
    })
    const maxProject = await prisma.tblProject.findFirst({
      select: {ID: true},
      orderBy: {ID: 'desc'},
    })

    expect(firstProject).not.toBeNull()
    expect(maxProject).not.toBeNull()

    if (!firstProject || !maxProject) {
      throw new Error('Expected at least one ticket in seeded integration database')
    }

    const existing = await getTicketById(firstProject.ID)
    await expect(getTicketById(maxProject.ID + 1_000_000)).rejects.toThrow('Failed to fetch ticket')

    expect(existing.ticket).toEqual(expect.objectContaining({ ID: firstProject.ID }))
  })

})
