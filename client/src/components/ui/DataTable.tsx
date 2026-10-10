'use client';

import React, { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiSearch, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { TableSkeleton } from './Skeleton';
import EmptyState from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchKey?: keyof T | ((item: T) => string);
  emptyMessage?: string;
  emptyTitle?: string;
  onRowClick?: (item: T) => void;
  actionButton?: React.ReactNode;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  searchPlaceholder = 'Search records...',
  searchKey,
  emptyMessage = 'No records match your filters.',
  emptyTitle = 'No data found',
  onRowClick,
  actionButton,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filter
  const filteredData = React.useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((item) => {
      if (typeof searchKey === 'function') {
        return searchKey(item).toLowerCase().includes(term);
      } else if (searchKey && typeof searchKey === 'string') {
        const val = item[searchKey];
        return String(val || '').toLowerCase().includes(term);
      }

      // Default: search all string values in item
      return Object.values(item).some((val) =>
        String(val || '').toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchKey]);

  // Sort
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredData, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else {
        setSortKey(null);
        setSortDir('asc');
      }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Bar: Search & Action Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
          />
        </div>
        {actionButton && <div>{actionButton}</div>}
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={columns.length} />
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="p-8">
            <EmptyState title={emptyTitle} description={emptyMessage} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-4 py-3.5 ${
                        col.sortable ? 'cursor-pointer hover:text-slate-200 select-none' : ''
                      } ${col.className || ''}`}
                      onClick={() => col.sortable && handleSort(col.key)}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="text-slate-500">
                            {sortKey === col.key ? (
                              sortDir === 'asc' ? (
                                <FiArrowUp className="w-3.5 h-3.5 text-teal-400" />
                              ) : (
                                <FiArrowDown className="w-3.5 h-3.5 text-teal-400" />
                              )
                            ) : null}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {paginatedData.map((item, index) => (
                  <tr
                    key={item.id || index}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`transition ${
                      onRowClick ? 'cursor-pointer hover:bg-slate-800/60' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-slate-300 ${col.className || ''}`}
                      >
                        {col.render ? col.render(item) : item[col.key] ?? '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && sortedData.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950/40 border-t border-slate-800 text-xs text-slate-400">
            <div>
              Showing{' '}
              <span className="font-medium text-slate-200">
                {(currentPage - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium text-slate-200">
                {Math.min(currentPage * pageSize, sortedData.length)}
              </span>{' '}
              of <span className="font-medium text-slate-200">{sortedData.length}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
