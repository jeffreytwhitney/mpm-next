import {
    getDepartments,
    getDepartmentById
} from '@/app/actions/departmentActions'
import { prisma } from '@/lib/prisma'

describe('Department Actions', () => {
    afterAll(async () => {
        await prisma.$disconnect()
    });

    it('gets Department by ID', async () => {
        const result = await getDepartmentById(1)
        expect(result).toEqual(expect.objectContaining({SiteID: 1}))
        expect(result).toEqual(expect.objectContaining({DepartmentName: 'Metrology'}))
    });

    it('gets Departments by SiteID', async () => {
        const results = await getDepartments(1);
        expect(results.every(d => d.SiteID === 1)).toBe(true)
    });
});
