import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ChartDataPoint {
    name: string;
    value: number;
    [key: string]: any;
}

interface ChartContextType {
    selectedData: ChartDataPoint | null;
    selectChartData: (data: ChartDataPoint) => void;
    clearSelection: () => void;
    getQuestionTemplate: () => string;
}

const ChartContext = createContext<ChartContextType | undefined>(undefined);

// Custom event for chart selection
const CHART_SELECT_EVENT = 'chart-element-selected';
const CHART_CLEAR_EVENT = 'chart-selection-cleared';

export function ChartProvider({ children }: { children: ReactNode }) {
    const [selectedData, setSelectedData] = useState<ChartDataPoint | null>(null);

    const selectChartData = (data: ChartDataPoint) => {
        console.log('📊 Chart element clicked:', data);
        setSelectedData(data);

        // Dispatch custom event so main app can listen
        window.dispatchEvent(new CustomEvent(CHART_SELECT_EVENT, { detail: data }));
    };

    const clearSelection = () => {
        setSelectedData(null);
        window.dispatchEvent(new CustomEvent(CHART_CLEAR_EVENT));
    };

    const getQuestionTemplate = () => {
        if (!selectedData) return '';
        return `Tell me more about ${selectedData.name} (value: ${selectedData.value})`;
    };

    // Listen for events from other ChartProvider instances
    useEffect(() => {
        const handleSelect = (e: Event) => {
            const customEvent = e as CustomEvent<ChartDataPoint>;
            setSelectedData(customEvent.detail);
        };

        const handleClear = () => {
            setSelectedData(null);
        };

        window.addEventListener(CHART_SELECT_EVENT, handleSelect);
        window.addEventListener(CHART_CLEAR_EVENT, handleClear);

        return () => {
            window.removeEventListener(CHART_SELECT_EVENT, handleSelect);
            window.removeEventListener(CHART_CLEAR_EVENT, handleClear);
        };
    }, []);

    return (
        <ChartContext.Provider
            value={{
                selectedData,
                selectChartData,
                clearSelection,
                getQuestionTemplate
            }}
        >
            {children}
        </ChartContext.Provider>
    );
}

export function useChart() {
    const context = useContext(ChartContext);
    if (context === undefined) {
        throw new Error('useChart must be used within a ChartProvider');
    }
    return context;
}
