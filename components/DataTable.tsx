"use client";

import React, { useState, useMemo } from 'react';
import { useChart } from '@/contexts/ChartContext';

interface DataTableProps {
    data: any[];
    title?: string;
    isExpanded?: boolean; // Control width behavior
}

export default function DataTable({ data, title, isExpanded = false }: DataTableProps) {
    const { selectChartData } = useChart();
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [searchTerm, setSearchTerm] = useState('');

    if (!data || data.length === 0) {
        return <div className="text-gray-500 text-center p-4">No data available</div>;
    }

    // Get column names from first object
    const columns = Object.keys(data[0]);

    // Sort and filter data
    const processedData = useMemo(() => {
        let filtered = data;

        // Filter by search term
        if (searchTerm) {
            filtered = data.filter(row =>
                Object.values(row).some(val =>
                    String(val).toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        // Sort data
        if (sortColumn) {
            filtered = [...filtered].sort((a, b) => {
                const aVal = a[sortColumn];
                const bVal = b[sortColumn];

                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                }

                const aStr = String(aVal).toLowerCase();
                const bStr = String(bVal).toLowerCase();

                if (sortDirection === 'asc') {
                    return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
                } else {
                    return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
                }
            });
        }

        return filtered;
    }, [data, sortColumn, sortDirection, searchTerm]);

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const handleRowClick = (row: any) => {
        // Find the first string or number column for the name
        const nameColumn = columns.find(col => typeof row[col] === 'string' || typeof row[col] === 'number');
        const valueColumn = columns.find(col => typeof row[col] === 'number');

        selectChartData({
            name: nameColumn ? String(row[nameColumn]) : 'Row',
            value: valueColumn ? row[valueColumn] : 0,
            ...row
        });
    };

    return (
        <div className="w-full">
            {/* Search */}
            <div className="mb-3 flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Search table..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
                        <tr>
                            {columns.map(column => (
                                <th
                                    key={column}
                                    onClick={() => handleSort(column)}
                                    className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{column}</span>
                                        {sortColumn === column && (
                                            <span className="text-yellow-300 font-bold">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {processedData.map((row, idx) => (
                            <tr
                                key={idx}
                                onClick={() => handleRowClick(row)}
                                className={`hover:bg-blue-50 cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                    }`}
                            >
                                {columns.map((column, colIdx) => (
                                    <td
                                        key={column}
                                        className={`px-4 py-3 text-sm whitespace-nowrap ${colIdx === 0 ? 'font-semibold text-gray-900' : 'text-gray-700'
                                            }`}
                                    >
                                        {typeof row[column] === 'number' ? row[column].toLocaleString() : String(row[column])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Results Count */}
            <div className="mt-2 text-xs text-gray-500 text-center">
                Showing {processedData.length} of {data.length} rows
            </div>
        </div>
    );
}
