"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { parseChartData } from '@/lib/chartParser';
import ChartRenderer from './ChartRenderer';

interface MessageRendererProps {
    content: string;
}

export default function MessageRenderer({ content }: MessageRendererProps) {
    const { text, charts } = parseChartData(content);

    return (
        <div className="space-y-4">
            {/* Render text with chart placeholders */}
            <ReactMarkdown
                components={{
                    // Replace [CHART_X] placeholders with actual charts
                    p: ({ children }) => {
                        const childText = String(children);
                        const chartMatch = childText.match(/\[CHART_(\d+)\]/);

                        if (chartMatch) {
                            const chartIndex = parseInt(chartMatch[1]);
                            const chart = charts[chartIndex];

                            if (chart) {
                                return <ChartRenderer data={chart.data} />;
                            }
                        }

                        return <p>{children}</p>;
                    },
                }}
            >
                {text}
            </ReactMarkdown>
        </div>
    );
}
