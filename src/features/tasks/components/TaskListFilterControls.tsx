/**
 * AUTO-GENERATED MODULE DOC
 * Feature module for 'tasks' domain behavior.
 */
import React from 'react'
import {type TaskStatusDropdownOption} from '@/server/data/taskStatus'
import {type TaskTypeDropdownOption} from '@/server/data/taskType'
import {type UserDropDownOption} from '@/server/data/user'
import {type DepartmentDropdownOption} from '@/server/data/department'
import {SELECT_FILTER_CLASS, FILTER_RESET_TITLE} from '@/lib/filterConstants'

interface StatusFilterProps {
    statusID: number | undefined
    statusPreset: string | undefined
    options: TaskStatusDropdownOption[]
    onChange: (value: string) => void
    onReset: () => void
}

export function StatusFilter({statusID, statusPreset, options, onChange, onReset}: StatusFilterProps) {
    const value = statusID !== undefined ? statusID.toString() : (statusPreset ?? '')
    return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_FILTER_CLASS} title={FILTER_RESET_TITLE} onDoubleClick={onReset}>
            <option value="">Active</option>
            <option value="activeNotWaiting">Not Waiting</option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
    )
}

interface TaskTypeFilterProps {
    taskTypeID: number | undefined
    options: TaskTypeDropdownOption[]
    onChange: (value: string) => void
    onReset: () => void
}

export function TaskTypeFilter({taskTypeID, options, onChange, onReset}: TaskTypeFilterProps) {
    const value = taskTypeID !== undefined ? taskTypeID.toString() : ''
    return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_FILTER_CLASS} title={FILTER_RESET_TITLE} onDoubleClick={onReset}>
            <option value="">All</option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
    )
}

interface AssignedToFilterProps {
    assignedToID: number | undefined
    unassignedPreset: string | undefined
    options: UserDropDownOption[]
    onChange: (value: string) => void
    onReset: () => void
}

export function AssignedToFilter({assignedToID, unassignedPreset, options, onChange, onReset}: AssignedToFilterProps) {
    const value = assignedToID !== undefined ? assignedToID.toString() : (unassignedPreset ?? '')
    return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_FILTER_CLASS} title={FILTER_RESET_TITLE} onDoubleClick={onReset}>
            <option value=""></option>
            <option value="unAssigned">Unassigned</option>
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

