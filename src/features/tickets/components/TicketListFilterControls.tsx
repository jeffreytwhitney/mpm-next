/**
 * AUTO-GENERATED MODULE DOC
 * Feature module for 'tickets' domain behavior.
 */
import React from 'react'
import {type UserDropDownOption} from '@/server/data/user'
import {type DepartmentDropdownOption} from '@/server/data/department'
import {SELECT_FILTER_CLASS, FILTER_RESET_TITLE} from '@/lib/filterConstants'


interface QualityEngineerFilterProps {
    qualityEngineerID: number | undefined
    options: UserDropDownOption[]
    onChange: (value: string) => void
    onReset: () => void
}

export function QualityEngineerFilter({qualityEngineerID, options, onChange, onReset}: QualityEngineerFilterProps) {
    const value = qualityEngineerID !== undefined ? qualityEngineerID.toString() : ''
    return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_FILTER_CLASS} title={FILTER_RESET_TITLE} onDoubleClick={onReset}>
            <option value=""></option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
    )
}

interface SubmittorFilterProps {
    submittorID: number | undefined
    options: UserDropDownOption[]
    onChange: (value: string) => void
    onReset: () => void
}

export function SubmittorFilter({submittorID, options, onChange, onReset}: SubmittorFilterProps) {
    const value = submittorID !== undefined ? submittorID.toString() : ''
    return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_FILTER_CLASS} title={FILTER_RESET_TITLE} onDoubleClick={onReset}>
            <option value=""></option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
    )
}

interface DepartmentFilterProps {
    departmentID: number | undefined
    options: DepartmentDropdownOption[]
    onChange: (value: string) => void
    onReset: () => void
}

export function DepartmentFilter({departmentID, options, onChange, onReset}: DepartmentFilterProps) {
    const value = departmentID !== undefined ? departmentID.toString() : ''
    return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_FILTER_CLASS} title={FILTER_RESET_TITLE} onDoubleClick={onReset}>
            <option value="">All</option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
    )
}

