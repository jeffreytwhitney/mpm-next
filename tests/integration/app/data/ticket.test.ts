beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(async () => {
  jest.restoreAllMocks()
  await prisma.$disconnect()
})

import {
  getTicketById
} from '@/server/data/ticket'
import {prisma} from '@/lib/prisma'

async function getTicketRange() {
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

  return {firstProject, maxProject}
}

describe('getTicketById integration', () => {

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('gets an existing ticket by ID', async () => {
    const {firstProject} = await getTicketRange()

    const existing = await getTicketById(firstProject.ID)

    expect(existing.ticket).toEqual(expect.objectContaining({ID: firstProject.ID}))
  })

  it('throws for a missing ticket ID', async () => {
    const {maxProject} = await getTicketRange()

    await expect(getTicketById(maxProject.ID + 1_000_000)).rejects.toThrow('Failed to fetch ticket')
  })

})

