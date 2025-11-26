"use client";

import React, { useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useCopilotMessagesContext } from '@copilotkit/react-core';
import ChartRenderer from './ChartRenderer';
import { ChartProvider } from '@/contexts/ChartContext';

export default function ChartInjector() {
    const { messages } = useCopilotMessagesContext();
    const rootsRef = useRef<Map<string, Root>>(new Map());
    const observerRef = useRef<MutationObserver | null>(null);
    const processingRef = useRef(false);

    console.log('🚀 ChartInjector component mounted, messages count:', messages.length);

    // Function to process code blocks and render charts
    const processCharts = () => {
        // Prevent concurrent processing
        if (processingRef.current) {
            console.log('⏳ Chart processing already in progress, skipping...');
            return;
        }

        // Use requestAnimationFrame to avoid React render cycle conflicts
        requestAnimationFrame(() => {
            processingRef.current = true;

            try {
                console.log('🔍 Processing charts, looking for code blocks...');
                const codeBlocks = document.querySelectorAll('pre code');
                console.log(`📝 Found ${codeBlocks.length} code blocks`);

                let chartsFound = 0;

                codeBlocks.forEach((codeElement, index) => {
                    const content = codeElement.textContent || '';

                    // Check if this looks like chart JSON
                    if (content && content.trim() && content.includes('"type"') && content.includes('"data"')) {
                        console.log('🎯 Potential chart data found!');
                        try {
                            const chartData = JSON.parse(content.trim());

                            // Validate it's a chart
                            if (chartData.type && chartData.data && Array.isArray(chartData.data)) {
                                chartsFound++;
                                const parentElement = codeElement.parentElement;

                                // CopilotKit uses div elements for code blocks, not pre
                                if (parentElement) {
                                    // Check if we've already processed this element
                                    if (parentElement.hasAttribute('data-chart-rendered')) {
                                        return;
                                    }

                                    // Mark as rendered FIRST to prevent re-processing
                                    parentElement.setAttribute('data-chart-rendered', 'true');
                                    console.log('✨ Rendering chart...');

                                    // Create a container for the chart
                                    const chartContainer = document.createElement('div');
                                    chartContainer.className = 'chart-container';
                                    const chartId = `chart-${Date.now()}-${Math.random()}`;
                                    chartContainer.setAttribute('data-chart-id', chartId);

                                    // Instead of replacing, insert after and hide original to avoid removeChild errors
                                    const grandparent = parentElement.parentElement;
                                    if (grandparent && document.body.contains(grandparent) && grandparent.contains(parentElement)) {
                                        try {
                                            // Verify elements still exist
                                            if (!document.body.contains(parentElement) || !document.body.contains(grandparent)) {
                                                console.log('⚠️ Elements removed from DOM during processing');
                                                return;
                                            }

                                            // Hide the original code block instead of removing it
                                            parentElement.style.display = 'none';

                                            // Insert chart container after the hidden element
                                            grandparent.insertBefore(chartContainer, parentElement.nextSibling);
                                            console.log('🔄 Inserted chart container and hid code block');

                                            // Render the chart using React - schedule it separately
                                            requestAnimationFrame(() => {
                                                try {
                                                    // Verify container still in DOM
                                                    if (!document.body.contains(chartContainer)) {
                                                        console.log('⚠️ Chart container removed before rendering');
                                                        return;
                                                    }

                                                    let root = rootsRef.current.get(chartId);

                                                    if (!root) {
                                                        root = createRoot(chartContainer);
                                                        rootsRef.current.set(chartId, root);
                                                        // Wrap with ChartProvider so it has access to context
                                                        root.render(
                                                            <ChartProvider>
                                                                <ChartRenderer data={chartData} />
                                                            </ChartProvider>
                                                        );
                                                        console.log('✅ Chart rendered successfully!');
                                                    }
                                                } catch (renderError) {
                                                    console.error('❌ Error rendering chart:', renderError);
                                                }
                                            });
                                        } catch (error) {
                                            console.error('❌ Error inserting element:', error);
                                            // Remove the render marker so it can be retried
                                            parentElement.removeAttribute('data-chart-rendered');
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            console.log('⚠️ JSON parse failed:', e);
                        }
                    }
                });

                console.log(`📊 Total charts found and processed: ${chartsFound}`);
            } finally {
                processingRef.current = false;
            }
        });
    };

    // Process charts when messages change
    useEffect(() => {
        console.log('💬 Messages changed, processing charts after delay...');
        const timer = setTimeout(() => {
            processCharts();
        }, 300);

        return () => clearTimeout(timer);
    }, [messages]);

    // Set up MutationObserver to watch for DOM changes
    useEffect(() => {
        console.log('👀 Setting up MutationObserver...');

        let debounceTimer: NodeJS.Timeout;

        observerRef.current = new MutationObserver((mutations) => {
            // Debounce to prevent rapid re-processing
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                console.log('🔄 DOM mutation detected, processing charts...');
                processCharts();
            }, 200);
        });

        // Observe the entire document body for changes
        observerRef.current.observe(document.body, {
            childList: true,
            subtree: true
        });

        return () => {
            console.log('🛑 Cleanup: Disconnecting observer and unmounting roots');
            clearTimeout(debounceTimer);
            observerRef.current?.disconnect();

            // Unmount all roots asynchronously to avoid React warnings
            requestAnimationFrame(() => {
                rootsRef.current.forEach((root, chartId) => {
                    try {
                        root.unmount();
                    } catch (e) {
                        console.error(`Failed to unmount root ${chartId}:`, e);
                    }
                });
                rootsRef.current.clear();
            });
        };
    }, []);

    return null;
}
