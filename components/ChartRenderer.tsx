"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
    PieChart, Pie, Cell,
    BarChart, Bar,
    LineChart, Line,
    AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ChartData } from '@/lib/chartParser';
import { useChart } from '@/contexts/ChartContext';
import DataTable from './DataTable';

interface ChartRendererProps {
    data: ChartData;
}

const DEFAULT_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export default function ChartRenderer({ data }: ChartRendererProps) {
    const colors = data.options?.colors || DEFAULT_COLORS;
    const { selectChartData } = useChart();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    // Default to table view if title contains "Table Format"
    const defaultViewMode = data.title?.toLowerCase().includes('table format') ? 'table' : 'chart';
    const [viewMode, setViewMode] = useState<'chart' | 'table'>(defaultViewMode);
    const [isExpanded, setIsExpanded] = useState(false); // Expand to full width

    // Create a unique key for this chart based on title and data
    const chartKey = useMemo(() => {
        return `chart_${data.title?.replace(/\s+/g, '_') || 'untitled'}_${data.type}`;
    }, [data.title, data.type]);

    // Load saved selections from localStorage
    const [chartType, setChartType] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(`${chartKey}_chartType`);
            return saved || data.type;
        }
        return data.type;
    });

    // Column selection for table data with localStorage
    const [selectedNameColumn, setSelectedNameColumn] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(`${chartKey}_nameColumn`) || '';
        }
        return '';
    });

    const [selectedValueColumn, setSelectedValueColumn] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(`${chartKey}_valueColumn`) || '';
        }
        return '';
    });

    // Save selections to localStorage when they change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(`${chartKey}_chartType`, chartType);
        }
    }, [chartType, chartKey]);

    useEffect(() => {
        if (typeof window !== 'undefined' && selectedNameColumn) {
            localStorage.setItem(`${chartKey}_nameColumn`, selectedNameColumn);
        }
    }, [selectedNameColumn, chartKey]);

    useEffect(() => {
        if (typeof window !== 'undefined' && selectedValueColumn) {
            localStorage.setItem(`${chartKey}_valueColumn`, selectedValueColumn);
        }
    }, [selectedValueColumn, chartKey]);

    // Reset view mode when title or type changes to detect "Table Format"
    useEffect(() => {
        const hasTableType = data.type === 'table';
        const hasTitleTableFormat = data.title?.toLowerCase().includes('table format');

        if (hasTableType || hasTitleTableFormat) {
            console.log('📋 Detected table data, switching to table view. Type:', data.type, 'Title:', data.title);
            setViewMode('table');
        } else {
            console.log('📊 Defaulting to chart view. Type:', data.type, 'Title:', data.title);
            setViewMode('chart');
        }
    }, [data.title, data.type]);

    // Determine which chart type to render (user override or default)
    const effectiveChartType = chartType || data.type;

    // Get available columns from table data
    const availableColumns = useMemo(() => {
        if (data.type !== 'table' || !data.data || data.data.length === 0) {
            return { all: [], name: [], value: [] };
        }

        const firstRow = data.data[0];
        const columns = Object.keys(firstRow);

        return {
            all: columns,
            name: columns, // All columns can be name
            value: columns.filter(col => typeof firstRow[col] === 'number') // Only numeric for values
        };
    }, [data.data, data.type]);

    // Set default selections when columns are available
    useMemo(() => {
        if (data.type === 'table' && availableColumns.all.length > 0 && !selectedNameColumn) {
            setSelectedNameColumn(availableColumns.all[0]); // First column as default
            if (availableColumns.value.length > 0) {
                setSelectedValueColumn(availableColumns.value[0]); // First numeric column
            }
        }
    }, [availableColumns, data.type, selectedNameColumn]);

    // Transform table data for chart rendering
    const transformedData = useMemo(() => {
        if (data.type !== 'table' || !data.data || data.data.length === 0) {
            return data.data;
        }

        // Use user-selected columns or defaults
        const nameCol = selectedNameColumn || availableColumns.all[0];
        const valueCol = selectedValueColumn || availableColumns.value[0];

        if (!nameCol || !valueCol) {
            console.warn('Missing name or value column for chart');
            return data.data;
        }

        // Transform to chart format
        return data.data.map(row => ({
            name: String(row[nameCol]),
            value: Number(row[valueCol]),
            originalData: row // Keep original for reference
        }));
    }, [data.data, data.type, selectedNameColumn, selectedValueColumn, availableColumns]);

    const handleClick = (dataPoint: any) => {
        console.log('📊 Chart element clicked:', dataPoint);
        selectChartData({
            name: dataPoint.name || dataPoint[data.options?.xAxisKey || 'name'],
            value: dataPoint.value || dataPoint[data.options?.yAxisKey || 'value'],
            ...dataPoint
        });
    };

    const renderPieChart = () => (
        <ResponsiveContainer width="100%" height={400}>
            <PieChart>
                <Pie
                    data={transformedData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    onClick={(data, index) => {
                        setActiveIndex(index);
                        handleClick(data);
                    }}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    style={{ cursor: 'pointer' }}
                >
                    {transformedData.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={colors[index % colors.length]}
                            opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                            stroke={activeIndex === index ? '#000' : 'none'}
                            strokeWidth={activeIndex === index ? 2 : 0}
                        />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );

    const renderBarChart = () => {
        const xKey = data.options?.xAxisKey || 'name';
        const yKey = data.options?.yAxisKey || 'value';

        return (
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={transformedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={xKey} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                        dataKey={yKey}
                        fill={colors[0]}
                        onClick={(data, index) => {
                            setActiveIndex(index);
                            handleClick(data);
                        }}
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                        style={{ cursor: 'pointer' }}
                        activeBar={{ stroke: '#000', strokeWidth: 2 }}
                    />
                </BarChart>
            </ResponsiveContainer>
        );
    };

    const renderLineChart = () => {
        const xKey = data.options?.xAxisKey || 'name';
        const yKey = data.options?.yAxisKey || 'value';

        return (
            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    data={transformedData}
                    onClick={(e: any) => {
                        if (e && e.activePayload && e.activePayload[0]) {
                            handleClick(e.activePayload[0].payload);
                        }
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={xKey} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey={yKey}
                        stroke={colors[0]}
                        strokeWidth={2}
                        activeDot={{ r: 8, cursor: 'pointer' }}
                        style={{ cursor: 'pointer' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        );
    };

    const renderAreaChart = () => {
        const xKey = data.options?.xAxisKey || 'name';
        const yKey = data.options?.yAxisKey || 'value';

        return (
            <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                    data={transformedData}
                    onClick={(e: any) => {
                        if (e && e.activePayload && e.activePayload[0]) {
                            handleClick(e.activePayload[0].payload);
                        }
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={xKey} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                        type="monotone"
                        dataKey={yKey}
                        stroke={colors[0]}
                        fill={colors[0]}
                        fillOpacity={0.6}
                        activeDot={{ r: 8, cursor: 'pointer' }}
                        style={{ cursor: 'pointer' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div className={`my-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm ${isExpanded ? 'w-full' : 'max-w-full'}`}>
            <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                {data.title && (
                    <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
                )}

                <div className="flex items-center gap-2">
                    {/* View Toggle Buttons */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('chart')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-all ${viewMode === 'chart'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            📊 Chart
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-all ${viewMode === 'table'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            📋 Table
                        </button>
                    </div>

                    {/* Expand/Collapse Button */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 rounded-lg transition-all"
                        title={isExpanded ? "Fit to window" : "Expand to full width"}
                    >
                        {isExpanded ? '⬅️➡️' : '↔️'} {isExpanded ? 'Fit' : 'Expand'}
                    </button>

                    {/* Chart Type Selector - Only show when in chart view */}
                    {viewMode === 'chart' && (
                        <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg p-1">
                            <button
                                onClick={() => setChartType('pie')}
                                className={`px-2 py-1 text-xs font-medium rounded transition-all ${effectiveChartType === 'pie'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-blue-700 hover:bg-blue-100'
                                    }`}
                                title="Pie Chart"
                            >
                                🥧 Pie
                            </button>
                            <button
                                onClick={() => setChartType('bar')}
                                className={`px-2 py-1 text-xs font-medium rounded transition-all ${effectiveChartType === 'bar'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-blue-700 hover:bg-blue-100'
                                    }`}
                                title="Bar Chart"
                            >
                                📊 Bar
                            </button>
                            <button
                                onClick={() => setChartType('line')}
                                className={`px-2 py-1 text-xs font-medium rounded transition-all ${effectiveChartType === 'line'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-blue-700 hover:bg-blue-100'
                                    }`}
                                title="Line Chart"
                            >
                                📈 Line
                            </button>
                            <button
                                onClick={() => setChartType('area')}
                                className={`px-2 py-1 text-xs font-medium rounded transition-all ${effectiveChartType === 'area'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-blue-700 hover:bg-blue-100'
                                    }`}
                                title="Area Chart"
                            >
                                📉 Area
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Column Selectors for Table Data - Only show when table type and in chart view */}
            {data.type === 'table' && viewMode === 'chart' && availableColumns.all.length > 0 && (
                <div className="mb-3 flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">📍 Select Columns:</span>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600">Category:</label>
                        <select
                            value={selectedNameColumn}
                            onChange={(e) => setSelectedNameColumn(e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            {availableColumns.name.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600">Values:</label>
                        <select
                            value={selectedValueColumn}
                            onChange={(e) => setSelectedValueColumn(e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            {availableColumns.value.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {viewMode === 'chart' ? (
                <div className="relative">
                    {/* Click hint */}
                    <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                        💬 Click to ask about data
                    </div>
                    <div className="w-full">
                        {effectiveChartType === 'pie' && renderPieChart()}
                        {effectiveChartType === 'bar' && renderBarChart()}
                        {effectiveChartType === 'line' && renderLineChart()}
                        {effectiveChartType === 'area' && renderAreaChart()}
                    </div>
                </div>
            ) : (
                <DataTable data={data.data} title={data.title} isExpanded={isExpanded} />
            )}
        </div>
    );
}
