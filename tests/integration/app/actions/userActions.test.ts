import {
    getMetrologyProgrammerUsers,
    getMetrologyUsers,
    getUserByEmployeeNumber,
    getUserById,
    getUsersByDepartmentAndUserTypeID,
} from '@/app/actions/userActions'
import { prisma } from '@/lib/prisma'


describe('userActions', () => {
    afterAll(async () => {
        await prisma.$disconnect()
    })

    it('gets user by ID', async () => {
        const result = await getUserById(10)
        expect(result).toEqual(expect.objectContaining({EmployeeNumber: '4404'}))
    });

    it('gets users by Employee Number', async () => {
        const result = await getUserByEmployeeNumber('4404')
        expect(result).toEqual(expect.objectContaining({ID: 10}))
    })

    it('get Metrology Users', async () => {
        const results = await getMetrologyUsers(1);
        expect(results.some(u => u.UserTypeID === 1)).toBe(true)
        expect(results.some(u => u.UserTypeID === 2)).toBe(true)
    })

    it('get Metrology Programmers', async () => {
        const results = await getMetrologyProgrammerUsers(1);
        expect(results.some(u => u.UserTypeID === 1)).toBe(true)
    })

    it('get users by Department and UserTypeID', async () => {
        const results = await getUsersByDepartmentAndUserTypeID(1, 1)
        expect(results.some(u => u.UserTypeID === 1)).toBe(true)
    })

})
