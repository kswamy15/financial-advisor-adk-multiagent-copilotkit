"use client";

import React, { useEffect } from 'react';
import { parseChartData } from '@/lib/chartParser';
import ChartRenderer from './ChartRenderer';

export default function ChatMessageEnhancer() {
    useEffect(() => {
        const processMessages = () => {
            // Find all message content elements
            const messageElements = document.querySelectorAll('[data-copilotkit-message]');

            messageElements.forEach((element) => {
                const content = element.textContent || '';

                // Check if this message contains chart data
                if (content && content.includes('```chart-json')) {
                    const { text, charts } = parseChartData(content);

                    // If we found charts, render them
                    if (charts.length > 0) {
                        // Clear the element
                        element.innerHTML = '';

                        // Create a container
                        const container = document.createElement('div');
                        container.className = 'space-y-4';

                        // Render text parts and charts
                        const parts = text.split(/\[CHART_\d+\]/);

                        parts.forEach((part, index) => {
                            // Add text part
                            if (part.trim()) {
                                const textDiv = document.createElement('div');
                                textDiv.className = 'prose max-w-none';
                                textDiv.innerHTML = part.replace(/\n/g, '<br>');
                                container.appendChild(textDiv);
                            }

                            // Add chart if exists
                            if (charts[index]) {
                                const chartDiv = document.createElement('div');
                                chartDiv.setAttribute('data-chart-index', index.toString());
                                container.appendChild(chartDiv);

                                // We'll use React portal to render the chart
                                const root = (window as any).chartRoots?.[`chart-${Date.now()}-${index}`];
                                // This is a simplified version - in production we'd use React portals properly
                            }
                        });

                        element.appendChild(container);
                    }
                }
            });
        };

        // Process messages initially and on changes
        processMessages();
        const observer = new MutationObserver(processMessages);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, []);

    return null;
}
