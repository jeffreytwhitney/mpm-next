'use server'

import {
  getManufacturingEngineerDropdownOptions,
  getQualityEngineerDropdownOptions,
  type UserDropDownOption,
} from '@/server/data/user'

export interface EngineerOptionsByDepartmentResult {
  qualityEngineerOptions: UserDropDownOption[]
  manufacturingEngineerOptions: UserDropDownOption[]
}

export async function getEngineerOptionsByDepartment(
  departmentID: number,
): Promise<EngineerOptionsByDepartmentResult> {
  if (!Number.isInteger(departmentID) || departmentID <= 0) {
    return {
      qualityEngineerOptions: [],
      manufacturingEngineerOptions: [],
    }
  }

  const [qualityEngineerOptions, manufacturingEngineerOptions] = await Promise.all([
    getQualityEngineerDropdownOptions(departmentID),
    getManufacturingEngineerDropdownOptions(departmentID),
  ])

  return {
    qualityEngineerOptions,
    manufacturingEngineerOptions,
  }
}

