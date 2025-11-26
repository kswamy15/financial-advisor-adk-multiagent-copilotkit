"use client";

import { useCopilotMessagesContext } from "@copilotkit/react-core";
import { useEffect, useMemo, useState } from "react";

console.log('📦 FinancialSuggestions.tsx FILE LOADED!');

interface Suggestion {
    title: string;
    message: string;
}

/**
 * Component that provides custom suggestion buttons based on chat context.
 * Completely bypasses LLM-based suggestion generation for 100% reliability.
 */
export default function FinancialSuggestions() {
    const { messages } = useCopilotMessagesContext();
    const [isVisible, setIsVisible] = useState(true);

    // Draggable state with persistent position
    const [position, setPosition] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('suggestionsPanelPosition');
            if (saved) {
                return JSON.parse(saved);
            }
        }
        // Default: centered at bottom
        return { x: window.innerWidth / 2 - 250, y: window.innerHeight - 150 };
    });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Log when component mounts
    useEffect(() => {
        console.log('🎬 FinancialSuggestions component MOUNTED');
        return () => console.log('🛑 FinancialSuggestions component UNMOUNTED');
    }, []);

    // Save position to localStorage when it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('suggestionsPanelPosition', JSON.stringify(position));
        }
    }, [position]);

    // Get the last assistant message
    const lastAssistantMessage = useMemo(() => {
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i] as any;
            if (msg?.role === 'assistant' && msg?.content) {
                return msg.content.toLowerCase();
            }
        }
        return "";
    }, [messages]);

    // Generate suggestions programmatically based on patterns
    const suggestions = useMemo(() => {
        if (!lastAssistantMessage) {
            return [
                { title: "Analyze AAPL", message: "Analyze AAPL stock" },
                { title: "Analyze MSFT", message: "Analyze MSFT stock" },
                { title: "General question", message: "What can you do?" }
            ];
        }

        // Pattern 1: Strategy selection (check this FIRST)
        if ((lastAssistantMessage.includes('which strategy') ||
            lastAssistantMessage.includes('select one of the following') ||
            lastAssistantMessage.includes('trading strategies') ||
            lastAssistantMessage.includes('choose a strategy') ||
            lastAssistantMessage.includes('strategy by name or number')) &&
            !lastAssistantMessage.includes('execution preferences')) {
            return [
                { title: "Strategy 1", message: "I choose Strategy 1" },
                { title: "Strategy 2", message: "I choose Strategy 2" },
                { title: "Strategy 3", message: "I choose Strategy 3" },
                { title: "Strategy 4", message: "I choose Strategy 4" },
                { title: "Strategy 5", message: "I choose Strategy 5" }
            ];
        }

        // Pattern 2: Execution/broker/order type preferences (more specific now)
        if ((lastAssistantMessage.includes('preferred broker') ||
            lastAssistantMessage.includes('specific broker') ||
            lastAssistantMessage.includes('order type') ||
            lastAssistantMessage.includes('limit order') ||
            lastAssistantMessage.includes('market order')) &&
            !lastAssistantMessage.includes('strategy') &&
            !lastAssistantMessage.includes('execution plan')) {
            return [
                { title: "No preference", message: "No specific broker or order type preference" },
                { title: "Market orders", message: "I typically use market orders" },
                { title: "Limit orders", message: "I prefer using limit orders" }
            ];
        }

        // Pattern 3: Risk attitude AND investment period question
        if (lastAssistantMessage.includes("risk") && lastAssistantMessage.includes("investment period")) {
            return [
                { title: "Conservative, Short-term", message: "I prefer conservative approach for short-term investment" },
                { title: "Moderate, Medium-term", message: "I prefer moderate risk for medium-term investment" },
                { title: "Aggressive, Long-term", message: "I prefer aggressive strategy for long-term investment" }
            ];
        }

        // Pattern 3: Just risk attitude question (more specific now)
        if ((lastAssistantMessage.includes("risk attitude") ||
            lastAssistantMessage.includes("risk tolerance") ||
            lastAssistantMessage.includes("risk appetite") ||
            lastAssistantMessage.includes("risk preference")) &&
            !lastAssistantMessage.includes("broker") &&
            !lastAssistantMessage.includes("execution")) {
            return [
                { title: "Conservative", message: "Conservative risk approach" },
                { title: "Moderate", message: "Moderate risk tolerance" },
                { title: "Aggressive", message: "Aggressive risk appetite" }
            ];
        }

        // Pattern 4: Investment period question
        if (lastAssistantMessage.includes("investment period") || lastAssistantMessage.includes("time horizon") || lastAssistantMessage.includes("investment time")) {
            return [
                { title: "Short-term", message: "Short-term investment (less than 1 year)" },
                { title: "Medium-term", message: "Medium-term investment (1-5 years)" },
                { title: "Long-term", message: "Long-term investment (5+ years)" }
            ];
        }

        // Pattern 4: Strategy selection (numbered list)
        if (lastAssistantMessage.includes("strategy") && (lastAssistantMessage.includes("1.") || lastAssistantMessage.includes("1:"))) {
            return [
                { title: "Strategy 1", message: "I choose Strategy 1" },
                { title: "Strategy 2", message: "I choose Strategy 2" },
                { title: "Strategy 3", message: "I choose Strategy 3" },
                { title: "Strategy 4", message: "I choose Strategy 4" }
            ];
        }

        // Pattern 5: Yes/No questions
        if (lastAssistantMessage.includes("?") && (
            lastAssistantMessage.includes("do you") ||
            lastAssistantMessage.includes("would you") ||
            lastAssistantMessage.includes("can you") ||
            lastAssistantMessage.includes("should") ||
            lastAssistantMessage.includes("is this")
        )) {
            return [
                { title: "Yes", message: "Yes" },
                { title: "No", message: "No" },
                { title: "Not sure", message: "I'm not sure" }
            ];
        }

        // Pattern 6: Analysis/data provided (no question mark at end)
        if (!lastAssistantMessage.trim().endsWith("?")) {
            return [
                { title: "Deep dive", message: "Can you provide a deeper analysis?" },
                { title: "Risks", message: "What are the main risks?" },
                { title: "Comparisons", message: "How does this compare to competitors?" },
                { title: "Show markdown", message: "Show me the detailed result as markdown" }
            ];
        }

        // Pattern 7: General question fallback
        return [
            { title: "Explain more", message: "Can you explain more?" },
            { title: "Show example", message: "Can you show me an example?" },
            { title: "Continue", message: "Please continue" }
        ];
    }, [lastAssistantMessage]);

    // Handle suggestion click
    const handleSuggestionClick = (suggestion: Suggestion) => {
        console.log('🔘 Suggestion clicked:', suggestion.message);

        // Hide suggestions immediately
        setIsVisible(false);

        // Try multiple approaches to find and trigger the chat input

        // Approach 1: Find textarea by various selectors
        const selectors = [
            'textarea[placeholder*="Message"]',
            'textarea[placeholder*="Type"]',
            'textarea',
            'input[type="text"]'
        ];

        let chatInput: HTMLTextAreaElement | HTMLInputElement | null = null;
        for (const selector of selectors) {
            chatInput = document.querySelector(selector) as HTMLTextAreaElement;
            if (chatInput) {
                console.log('✅ Found input with selector:', selector);
                break;
            }
        }

        if (!chatInput) {
            console.warn('❌ Could not find chat input');
            setTimeout(() => setIsVisible(true), 500);
            return;
        }

        // Set the value using React's internal mechanism
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
        )?.set;

        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(chatInput, suggestion.message);
        } else {
            chatInput.value = suggestion.message;
        }

        console.log('📝 Set input value to:', suggestion.message);

        // Focus the input first
        chatInput.focus();

        // Trigger input event
        const inputEvent = new Event('input', { bubbles: true });
        chatInput.dispatchEvent(inputEvent);

        // Now simulate pressing Enter to send the message
        setTimeout(() => {
            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
            });

            chatInput!.dispatchEvent(enterEvent);
            console.log('✅ Simulated Enter key press');
        }, 200);
    };

    // Show/hide suggestions based on whether the AI is asking for input
    useEffect(() => {
        // Only show suggestions if:
        // 1. The last message is from the assistant
        // 2. It's explicitly asking for user input

        const lastMsg = messages[messages.length - 1] as any;
        const isAssistantMessage = lastMsg?.role === 'assistant';

        if (!isAssistantMessage) {
            setIsVisible(false);
            return;
        }

        const content = (lastMsg?.content || '').toLowerCase();

        // Check if the message is ASKING for input (not just mentioning topics)
        const isAskingQuestion = content.trim().endsWith('?');

        const isRequestingInput =
            content.includes('please select') ||
            content.includes('please specify') ||
            content.includes('please tell me') ||
            content.includes('please choose') ||
            content.includes('select one') ||
            content.includes('choose one') ||
            content.includes('which strategy') ||
            content.includes('what is your') ||
            content.includes('do you prefer') ||
            content.includes('would you like');

        // Only check for risk/investment keywords if there's also a question or request
        const isAskingForPreferences =
            (content.includes('tell me your risk') || content.includes('what is your risk')) ||
            (content.includes('tell me') && content.includes('investment period'));

        const needsInput = isAskingQuestion || isRequestingInput || isAskingForPreferences;

        setIsVisible(needsInput);
    }, [messages]);

    // Drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    if (!isVisible || suggestions.length === 0) {
        return null;
    }

    return (
        <div
            className="fixed z-50 max-w-2xl"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                cursor: isDragging ? 'grabbing' : 'grab'
            }}
        >
            {/* Drag Handle */}
            <div
                onMouseDown={handleMouseDown}
                className="flex items-center justify-center gap-2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-t-lg cursor-grab active:cursor-grabbing select-none"
            >
                <span>⋮⋮</span>
                <span>Quick Replies</span>
                <span className="text-blue-200">(drag to move)</span>
            </div>

            <div className="flex flex-wrap gap-2 p-4 bg-white/95 dark:bg-gray-900/95 rounded-b-lg shadow-lg backdrop-blur-sm">
                {suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                        {suggestion.title}
                    </button>
                ))}
            </div>
        </div>
    );
}
