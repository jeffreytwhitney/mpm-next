const mockGetQualityEngineerDropdownOptions = jest.fn()
const mockGetManufacturingEngineerDropdownOptions = jest.fn()

jest.mock('@/server/data/user', () => ({
    getQualityEngineerDropdownOptions: (...args: unknown[]) => mockGetQualityEngineerDropdownOptions(...args),
    getManufacturingEngineerDropdownOptions: (...args: unknown[]) =>
        mockGetManufacturingEngineerDropdownOptions(...args),
}))

import {getEngineerOptionsByDepartment} from '@/features/tickets/actions/getEngineerOptionsByDepartmentAction'

describe('getEngineerOptionsByDepartment', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('returns empty arrays without hitting the database for a zero departmentID', async () => {
        await expect(getEngineerOptionsByDepartment(0)).resolves.toEqual({
            qualityEngineerOptions: [],
            manufacturingEngineerOptions: [],
        })

        expect(mockGetQualityEngineerDropdownOptions).not.toHaveBeenCalled()
        expect(mockGetManufacturingEngineerDropdownOptions).not.toHaveBeenCalled()
    })

    it('returns empty arrays without hitting the database for a negative departmentID', async () => {
        await expect(getEngineerOptionsByDepartment(-5)).resolves.toEqual({
            qualityEngineerOptions: [],
            manufacturingEngineerOptions: [],
        })

        expect(mockGetQualityEngineerDropdownOptions).not.toHaveBeenCalled()
        expect(mockGetManufacturingEngineerDropdownOptions).not.toHaveBeenCalled()
    })

    it('returns empty arrays without hitting the database for a non-integer (float) departmentID', async () => {
        await expect(getEngineerOptionsByDepartment(3.7)).resolves.toEqual({
            qualityEngineerOptions: [],
            manufacturingEngineerOptions: [],
        })

        expect(mockGetQualityEngineerDropdownOptions).not.toHaveBeenCalled()
        expect(mockGetManufacturingEngineerDropdownOptions).not.toHaveBeenCalled()
    })

    it('returns empty arrays without hitting the database for NaN', async () => {
        await expect(getEngineerOptionsByDepartment(NaN)).resolves.toEqual({
            qualityEngineerOptions: [],
            manufacturingEngineerOptions: [],
        })

        expect(mockGetQualityEngineerDropdownOptions).not.toHaveBeenCalled()
        expect(mockGetManufacturingEngineerDropdownOptions).not.toHaveBeenCalled()
    })

    it('fetches both option sets in parallel for a valid departmentID', async () => {
        const qeOptions = [{value: 10, label: 'Jane QE'}]
        const meOptions = [{value: 20, label: 'John ME'}]

        mockGetQualityEngineerDropdownOptions.mockResolvedValueOnce(qeOptions)
        mockGetManufacturingEngineerDropdownOptions.mockResolvedValueOnce(meOptions)

        await expect(getEngineerOptionsByDepartment(7)).resolves.toEqual({
            qualityEngineerOptions: qeOptions,
            manufacturingEngineerOptions: meOptions,
        })

        expect(mockGetQualityEngineerDropdownOptions).toHaveBeenCalledWith(7)
        expect(mockGetManufacturingEngineerDropdownOptions).toHaveBeenCalledWith(7)
    })
})

