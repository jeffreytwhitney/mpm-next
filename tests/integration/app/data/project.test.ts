import {
  getProjectById
} from '@/server/data/project'
import {prisma} from '@/lib/prisma'

describe('Project Actions', () => {

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('gets an existing project by ID and returns null for a missing ID', async () => {
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
      throw new Error('Expected at least one project in seeded integration database')
    }

    const existing = await getProjectById(firstProject.ID)
    const missing = await getProjectById(maxProject.ID + 1_000_000)

    expect(existing).toEqual(expect.objectContaining({ ID: firstProject.ID }))
    expect(missing).toBeNull()
  })

})

