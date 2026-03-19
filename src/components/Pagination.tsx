import React from 'react'
import { ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon } from '@heroicons/react/24/solid'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, totalCount, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between mt-2 px-1 text-xs text-slate-600">
      <span>{totalCount.toLocaleString()} results</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="px-2 py-1 border rounded text-xs disabled:opacity-40 hover:bg-slate-100 disabled:cursor-not-allowed"
          title="First page"
        >
          <ChevronDoubleLeftIcon className="w-3 h-3" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-2 py-1 border rounded text-xs disabled:opacity-40 hover:bg-slate-100 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <ChevronLeftIcon className="w-3 h-3" />
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-2 py-1 border rounded text-xs disabled:opacity-40 hover:bg-slate-100 disabled:cursor-not-allowed"
          title="Next page"
        >
          <ChevronRightIcon className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

