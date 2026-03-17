import {
    getDepartments,
    getDepartmentById, getDepartmentDropdownOptions, getTopLevelDepartmentDropdownOptions, getTopLevelDepartments
} from '@/server/data/department'
import {prisma} from '@/lib/prisma'



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

    it('Gets Department Dropdown Options', async () => {
        const results = await getDepartmentDropdownOptions(1);
        expect(results.some(r => r.value === 1)).toBe(true);
    })
    
    it('Gets Top Level Departments', async () => {
        const results = await getTopLevelDepartments(1);
        expect(results.every(d => d.ParentID === null)).toBe(true);
    })

    it('Gets Top Level Department Dropdown Options', async () => {
        const results = await getTopLevelDepartmentDropdownOptions(1);
        expect(results.length).toBeGreaterThan(0);
        expect(results.every(result => result.label.length > 0)).toBe(true);
    })

    it('returns empty results for an unassigned site id', async () => {
        const siteIdWithoutDepartments = 3;

        await expect(getDepartments(siteIdWithoutDepartments)).resolves.toEqual([]);
        await expect(getTopLevelDepartments(siteIdWithoutDepartments)).resolves.toEqual([]);
        await expect(getDepartmentDropdownOptions(siteIdWithoutDepartments)).resolves.toEqual([]);
        await expect(getTopLevelDepartmentDropdownOptions(siteIdWithoutDepartments)).resolves.toEqual([]);
    })

    it('returns null when department id is greater than the max id', async () => {
        const maxDepartment = await prisma.tblDepartment.findFirst({
            select: {ID: true},
            orderBy: {ID: 'desc'},
        });

        expect(maxDepartment).not.toBeNull();
        const result = await getDepartmentById((maxDepartment?.ID ?? 0) + 1_000_000);
        expect(result).toBeNull();
    })
});
