"use client";

import { useEffect, useState, useRef } from 'react';
import { getFilteredSuggestions, type AutocompleteItem } from '@/lib/autocompleteData';

interface ChatAutocompleteProps {
    onSelect?: (item: AutocompleteItem) => void;
}

/**
 * Chat autocomplete component that provides suggestions for stock tickers and question templates
 * Custom implementation that works alongside CopilotKit's chat input
 */
export default function ChatAutocomplete({ onSelect }: ChatAutocompleteProps) {
    const [inputValue, setInputValue] = useState('');
    const [items, setItems] = useState<AutocompleteItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [chatInput, setChatInput] = useState<HTMLTextAreaElement | null>(null);
    const [inputRect, setInputRect] = useState<DOMRect | null>(null);
    const observerRef = useRef<MutationObserver | null>(null);

    // Find CopilotKit's chat input and watch for changes
    useEffect(() => {
        const findChatInput = () => {
            const selectors = [
                'textarea[placeholder*="Ask"]',
                'textarea[placeholder*="Message"]',
                'textarea[placeholder*="Type"]',
                'textarea'
            ];

            for (const selector of selectors) {
                const input = document.querySelector(selector) as HTMLTextAreaElement;
                if (input && document.body.contains(input)) {
                    // Only update if it's a different element or if we don't have one
                    if (!chatInput || chatInput !== input) {
                        console.log('✅ Found chat input with selector:', selector);
                        setChatInput(input);
                    }
                    return input;
                }
            }
            return null;
        };

        // Initial find
        findChatInput();

        // Check if current input is still in DOM, if not, re-find
        const checkInterval = setInterval(() => {
            if (!chatInput || !document.body.contains(chatInput)) {
                console.log('🔄 Chat input lost, searching again...');
                findChatInput();
            }
        }, 1000); // Check every second

        // Also watch for DOM changes
        observerRef.current = new MutationObserver(() => {
            const foundInput = findChatInput();
            if (foundInput) {
                // Don't disconnect - keep watching for changes
            }
        });

        observerRef.current.observe(document.body, {
            childList: true,
            subtree: true
        });

        return () => {
            clearInterval(checkInterval);
            observerRef.current?.disconnect();
        };
    }, []); // Run once on mount, interval and observer handle updates

    // Listen to input changes and update position
    useEffect(() => {
        if (!chatInput) return;

        const handleInput = (e: Event) => {
            const target = e.target as HTMLTextAreaElement;
            const value = target.value;
            setInputValue(value);

            // Get filtered suggestions
            const suggestions = getFilteredSuggestions(value);
            setItems(suggestions);
            setIsOpen(suggestions.length > 0 && value.length > 0);
            setHighlightedIndex(0);

            // Update position
            setInputRect(target.getBoundingClientRect());

            console.log(`💬 Input: "${value}", Suggestions: ${suggestions.length}`);
        };

        const handleFocus = () => {
            setInputRect(chatInput.getBoundingClientRect());
            const suggestions = getFilteredSuggestions(chatInput.value);
            if (suggestions.length > 0) {
                setItems(suggestions);
                setIsOpen(true);
            }
        };

        const handleBlur = () => {
            // Delay to allow click on suggestion
            setTimeout(() => setIsOpen(false), 200);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen || items.length === 0) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setHighlightedIndex((prev) => (prev + 1) % items.length);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setHighlightedIndex((prev) => (prev - 1 + items.length) % items.length);
                    break;
                case 'Enter':
                    if (highlightedIndex >= 0 && highlightedIndex < items.length) {
                        e.preventDefault();
                        handleSelectItem(items[highlightedIndex]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    setIsOpen(false);
                    break;
            }
        };

        chatInput.addEventListener('input', handleInput);
        chatInput.addEventListener('focus', handleFocus);
        chatInput.addEventListener('blur', handleBlur);
        chatInput.addEventListener('keydown', handleKeyDown);

        return () => {
            chatInput.removeEventListener('input', handleInput);
            chatInput.removeEventListener('focus', handleFocus);
            chatInput.removeEventListener('blur', handleBlur);
            chatInput.removeEventListener('keydown', handleKeyDown);
        };
    }, [chatInput, isOpen, items, highlightedIndex]);

    const handleSelectItem = (item: AutocompleteItem) => {
        if (!chatInput) return;

        console.log('🔘 Selecting item:', item.value);

        // Use React's native value setter to bypass React's tracking
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
        )?.set;

        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(chatInput, item.value);
        } else {
            chatInput.value = item.value;
        }

        console.log('📝 Set value to:', chatInput.value);

        // Trigger input event with the correct value
        const inputEvent = new Event('input', { bubbles: true });
        Object.defineProperty(inputEvent, 'target', {
            writable: false,
            value: chatInput
        });
        chatInput.dispatchEvent(inputEvent);

        // Also trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        chatInput.dispatchEvent(changeEvent);

        // Focus the input and move cursor to end
        chatInput.focus();
        chatInput.setSelectionRange(item.value.length, item.value.length);

        // Close dropdown
        setIsOpen(false);

        // Call optional callback
        onSelect?.(item);

        console.log('✅ Autocomplete selection complete:', item.value);
    };

    // Only show when there are suggestions and dropdown is open
    if (!isOpen || items.length === 0 || !chatInput || !inputRect) {
        return null;
    }

    return (
        <div
            className="fixed z-[999] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-80 overflow-y-auto"
            style={{
                left: `${inputRect.left}px`,
                bottom: `${window.innerHeight - inputRect.top + 10}px`,
                width: `${inputRect.width}px`,
                maxWidth: '600px'
            }}
        >
            {items.map((item, index) => (
                <div
                    key={`${item.value}-${index}`}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-4 py-2 cursor-pointer transition-colors ${highlightedIndex === index
                        ? 'bg-blue-50 dark:bg-blue-900/50'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        {/* Icon based on type */}
                        {item.type === 'ticker' && (
                            <span className="text-blue-600 dark:text-blue-400">📈</span>
                        )}
                        {item.type === 'template' && (
                            <span className="text-purple-600 dark:text-purple-400">💭</span>
                        )}

                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {item.label}
                            </div>
                            {item.type && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.type === 'ticker' ? 'Stock Ticker' : 'Question Template'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
