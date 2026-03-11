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

    it('gets an actual freakin user and not just a mock', async () => {
        const result = await getUserById(10)
        expect(result).toEqual(expect.objectContaining({EmployeeNumber: '4404'}))
    });

    it('get Metrology Users', async () => {
        const results = await getMetrologyUsers(1);
        expect(results.some(u => u.UserTypeID === 1)).toBe(true)
        expect(results.some(u => u.UserTypeID === 2)).toBe(true)
    })

})
