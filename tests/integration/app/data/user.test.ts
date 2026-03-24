beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(async () => {
  jest.restoreAllMocks()
  await prisma.$disconnect()
})

import {
    getActiveUserForAuth,
    getMetrologyProgrammerUsers,
    getMetrologyUsers,
    getUserByEmployeeNumber,
    getUserById,
    getUsersByDepartmentAndUserTypeID,
} from '@/server/data/user'
import { prisma } from '@/lib/prisma'



describe('userActions', () => {

    it('gets user by ID', async () => {
        const result = await getUserById(10)
        expect(result).toEqual(expect.objectContaining({EmployeeNumber: '4404'}))
        expect(result).not.toHaveProperty('Password')
    });

    it('gets users by Employee Number', async () => {
        const result = await getUserByEmployeeNumber('4404')
        expect(result).toEqual(expect.objectContaining({ID: 10}))
    })

    it('gets active user for auth with password field available', async () => {
        const result = await getActiveUserForAuth('4404')

        expect(result).toEqual(expect.objectContaining({ID: 10, EmployeeNumber: '4404'}))
        expect(result).toHaveProperty('Password')
    })

    it('get Metrology Users', async () => {
        const results = await getMetrologyUsers(1);
        expect(results.some(u => u.UserTypeID === 1)).toBe(true)
        expect(results.some(u => u.UserTypeID === 2)).toBe(true)
    })

    it('get Metrology Programmers', async () => {
        const results = await getMetrologyProgrammerUsers(1);
        expect(results.every(u => u.UserTypeID === 1)).toBe(true)
    })

    it('get users by Department and UserTypeID', async () => {
        const results = await getUsersByDepartmentAndUserTypeID(1, 1)
        expect(results.some(u => u.UserTypeID === 1)).toBe(true)
    })

    it('makes sure invalid UserID returns null', async () => {
        const maxUser = await prisma.tblUser.findFirst({
            select: { ID: true },
            orderBy: { ID: 'desc' },
        });
        expect(maxUser).not.toBeNull();
        if (!maxUser) {
            throw new Error('Expected at least one user in database')
        }
        const missing = await getUserById(maxUser.ID + 1_000_000)
        expect(missing).toBeNull()
    })

})
