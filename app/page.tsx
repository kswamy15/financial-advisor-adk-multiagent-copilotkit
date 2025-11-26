"use client";

import { useState, useEffect, useRef } from "react";
import { CopilotKit, useCopilotMessagesContext } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import { loadMessagesFromJsonRepresentation, convertMessagesToGqlInput } from "@copilotkit/runtime-client-gql";
import { MessageSquare, Plus, Trash2, Pencil } from "lucide-react";
import SourceModal from "@/components/SourceModal";
import ChartInjector from "@/components/ChartInjector";
import FinancialSuggestions from "@/components/FinancialSuggestions";
import ChatAutocomplete from "@/components/ChatAutocomplete";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginModal from "@/components/LoginModal";
import UserAvatar from "@/components/UserAvatar";
import { ChartProvider, useChart } from "@/contexts/ChartContext";

interface ChatSession {
  id: string;
  title: string;
  createdAt: string; // Store as ISO string for localStorage
  threadId: string; // Unique thread ID for CopilotKit to separate chat history
}

const STORAGE_KEY = "chat_sessions";
const ACTIVE_SESSION_KEY = "active_session_id";

// Component to manage chat history persistence
function ChatManager({ sessionId, userId }: { sessionId: string; userId?: string }) {
  const { messages, setMessages } = useCopilotMessagesContext();
  const sessionIdRef = useRef(sessionId);
  const hasLoadedRef = useRef(false);
  const userIdRef = useRef(userId);
  const messagesSessionIdRef = useRef(sessionId); // Track which session these messages belong to
  const isLoadingRef = useRef(false); // Track if we're currently loading a session

  // Load messages when session changes
  useEffect(() => {
    const storageKey = userId ? `chat_messages_${userId}_${sessionId}` : `chat_messages_${sessionId}`;
    console.log(`🔄 ChatManager: Session changed to ${sessionId} (user: ${userId || 'anonymous'})`);

    // CRITICAL: Mark as loading to prevent any saves during the transition
    isLoadingRef.current = true;

    // IMMEDIATELY clear messages and mark as not loaded
    setMessages([]);
    hasLoadedRef.current = false;

    const savedMessages = localStorage.getItem(storageKey);

    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        const messagesToLoad = Array.isArray(parsed) ? parsed : [];

        console.log(`📦 Parsed ${messagesToLoad.length} messages from storage for session ${sessionId}`);

        if (messagesToLoad.length > 0) {
          const rehydratedMessages = loadMessagesFromJsonRepresentation(messagesToLoad);
          console.log(`✅ Loaded ${rehydratedMessages.length} messages from storage`);
          try {
            setMessages(rehydratedMessages);
            console.log(`📝 Set ${rehydratedMessages.length} messages in context`);
          } catch (setError) {
            console.error(`❌ Failed to set messages in context:`, setError);
          }
        } else {
          console.log(`🆕 New empty session ${sessionId}`);
        }
      } catch (e) {
        console.error(`❌ Failed to load messages for session ${sessionId}:`, e);
      }
    } else {
      console.log(`🆕 New empty session ${sessionId} (no saved data)`);
    }

    // Mark as loaded and update refs for this session
    hasLoadedRef.current = true;
    sessionIdRef.current = sessionId;
    userIdRef.current = userId;
    messagesSessionIdRef.current = sessionId; // Mark that messages now belong to this session

    // CRITICAL: Delay clearing isLoadingRef to ensure messages are actually cleared
    // setTimeout ensures this runs in the next tick, after React has processed setMessages([])
    setTimeout(() => {
      isLoadingRef.current = false; // Loading complete, saves can now proceed
      console.log(`✅ Loading complete for session ${sessionId}, saves enabled`);
    }, 0);

    // Cleanup function: when session is about to change, mark as not loaded
    // This prevents any pending saves from executing
    return () => {
      console.log(`🧹 Cleaning up session ${sessionId}`);
      hasLoadedRef.current = false;
      messagesSessionIdRef.current = ''; // Clear to prevent any saves
    };
  }, [sessionId, userId, setMessages]);

  // Recovery mechanism: Reload messages if they get cleared unexpectedly
  // This handles cases like Fast Refresh or CopilotKit reinitialization
  useEffect(() => {
    // Only run if we're not currently loading and session is supposed to have loaded
    if (isLoadingRef.current || !hasLoadedRef.current) {
      return;
    }

    // Check if messages are empty but storage has data
    if (messages.length === 0) {
      const storageKey = userId ? `chat_messages_${userId}_${sessionId}` : `chat_messages_${sessionId}`;
      const savedMessages = localStorage.getItem(storageKey);

      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          const messagesToLoad = Array.isArray(parsed) ? parsed : [];

          if (messagesToLoad.length > 0) {
            console.log(`🔄 Recovery: Reloading ${messagesToLoad.length} messages that were cleared`);
            const rehydratedMessages = loadMessagesFromJsonRepresentation(messagesToLoad);
            setMessages(rehydratedMessages);
          }
        } catch (e) {
          console.error(`❌ Recovery failed:`, e);
        }
      }
    }
  }, [messages.length, sessionId, userId, setMessages]); // Run when message count changes

  // Save messages when they change (only after initial load)
  useEffect(() => {
    // Skip if we're currently loading a session (prevents saving old messages during transition)
    if (isLoadingRef.current) {
      console.log(`⏭️ Skipping save - session is loading`);
      return;
    }

    // Skip if we haven't finished loading yet
    if (!hasLoadedRef.current) {
      console.log(`⏭️ Skipping save - haven't loaded yet`);
      return;
    }

    // Skip if no messages
    if (messages.length === 0) {
      console.log(`⏭️ Skipping save - no messages to save`);
      return;
    }

    // CRITICAL: Only save if messages belong to the current session
    // This prevents saving old messages under a new session's key during session switches
    if (messagesSessionIdRef.current !== sessionId) {
      console.log(`⚠️ Skipping save - messages belong to session ${messagesSessionIdRef.current}, not ${sessionId}`);
      return;
    }

    const storageKey = userId ? `chat_messages_${userId}_${sessionId}` : `chat_messages_${sessionId}`;
    console.log(`💾 [SessionId: ${sessionId}] Saving ${messages.length} messages to ${storageKey}`);
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
      console.log(`✅ [SessionId: ${sessionId}] Successfully saved ${messages.length} messages`);
    } catch (e) {
      console.error(`❌ [SessionId: ${sessionId}] Failed to save messages:`, e);
    }
  }, [messages, sessionId, userId]);

  return null;
}

// Debug component to visualize persistence state
function DebugPanel({ sessionId, userId }: { sessionId: string; userId?: string }) {
  const { messages } = useCopilotMessagesContext();
  const [savedCount, setSavedCount] = useState<number>(0);
  const [lastSaved, setLastSaved] = useState<string>("-");

  // Draggable state
  const [position, setPosition] = useState({ x: window.innerWidth - 250, y: window.innerHeight - 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const checkStorage = () => {
      const storageKey = userId ? `chat_messages_${userId}_${sessionId}` : `chat_messages_${sessionId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Handle both raw array and GQL input format (which has 'messages' field or is array)
          const count = Array.isArray(parsed) ? parsed.length : (parsed.messages ? parsed.messages.length : 0);
          setSavedCount(count);
          setLastSaved(new Date().toLocaleTimeString());
        } catch (e) {
          setSavedCount(-1);
        }
      } else {
        setSavedCount(0);
      }
    };

    // Check immediately and set up interval
    checkStorage();
    const interval = setInterval(checkStorage, 1000);
    return () => clearInterval(interval);
  }, [sessionId, userId, messages]); // Re-check when messages change

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

  return (
    <div
      className="fixed bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-xs shadow-xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      <h3 className="font-bold mb-2 text-yellow-400 flex items-center gap-2">
        <span>⋮⋮</span>
        Persistence Debugger
        <span className="text-gray-500 text-[10px]">(drag to move)</span>
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-gray-400">Session ID:</span>
        <span>{sessionId}</span>

        <span className="text-gray-400">Context Msgs:</span>
        <span className={messages.length > 0 ? "text-green-400" : "text-gray-300"}>
          {messages.length}
        </span>

        <span className="text-gray-400">Storage Msgs:</span>
        <span className={savedCount > 0 ? "text-green-400" : "text-gray-300"}>
          {savedCount}
        </span>

        <span className="text-gray-400">Last Check:</span>
        <span>{lastSaved}</span>
      </div>
    </div>
  );
}

function HomeContent() {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { selectedData, clearSelection, getQuestionTemplate } = useChart();

  // Initialize sessions from localStorage or use default
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: "1",
      title: "New Chat",
      createdAt: new Date().toISOString(),
      threadId: "thread_1",
    },
  ]);

  const [activeSessionId, setActiveSessionId] = useState<string>("1");
  const [mounted, setMounted] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");

  // Sidebar resize state
  const [sidebarWidth, setSidebarWidth] = useState<number>(256); // Always start with 256px to prevent hydration mismatch
  const [isResizing, setIsResizing] = useState(false);

  // Load sidebar width from localStorage after mount (client-only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarWidth');
      if (saved) {
        setSidebarWidth(parseInt(saved));
      }
    }
  }, []); // Only run once on mount

  // Save sidebar width to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarWidth', sidebarWidth.toString());
    }
  }, [sidebarWidth]);

  // Handle sidebar resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 500) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);


  // Load/save sessions based on user - separate storage for each user
  const getStorageKey = (key: string) => {
    return user ? `${key}_${user.id}` : key;
  };

  // Load from localStorage after mount (client-only) or when user changes
  useEffect(() => {
    setMounted(true);
    const userStorageKey = getStorageKey(STORAGE_KEY);
    const userActiveKey = getStorageKey(ACTIVE_SESSION_KEY);

    console.log(`📂 Loading sessions for: ${user ? user.email : 'anonymous'}`);
    const stored = localStorage.getItem(userStorageKey);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log(`✅ Loaded ${parsed.length} sessions from storage`);
        setSessions(parsed.map((session: any) => ({
          ...session,
          threadId: session.threadId || `thread_${session.id}`,
        })));
      } catch (e) {
        console.error("Failed to parse stored sessions:", e);
      }
    } else {
      // No stored sessions - create fresh default
      console.log(`🆕 Creating fresh session list for ${user ? user.email : 'anonymous'}`);
      const defaultSession = {
        id: `${Date.now()}`,
        title: "New Chat",
        createdAt: new Date().toISOString(),
        threadId: `thread_${Date.now()}`,
      };
      setSessions([defaultSession]);
      setActiveSessionId(defaultSession.id);
      return;
    }

    const storedActiveId = localStorage.getItem(userActiveKey);
    if (storedActiveId) {
      setActiveSessionId(storedActiveId);
    }
  }, [user]);

  const [modalSource, setModalSource] = useState<{
    title: string;
    url: string;
    snippet: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ sessionId: string; sessionTitle: string } | null>(null);

  // Save sessions to localStorage whenever they change (user-specific)
  useEffect(() => {
    if (typeof window !== "undefined" && mounted) {
      const userStorageKey = getStorageKey(STORAGE_KEY);
      localStorage.setItem(userStorageKey, JSON.stringify(sessions));
      console.log(`💾 Saved ${sessions.length} sessions for ${user ? user.email : 'anonymous'}`);
    }
  }, [sessions, user, mounted]);

  // Save active session ID whenever it changes (user-specific)
  useEffect(() => {
    if (typeof window !== "undefined" && mounted) {
      const userActiveKey = getStorageKey(ACTIVE_SESSION_KEY);
      localStorage.setItem(userActiveKey, activeSessionId);
    }
  }, [activeSessionId, user, mounted]);

  // Function to create a new chat session
  const createNewChat = () => {
    const sessionId = Date.now().toString();
    const newSession: ChatSession = {
      id: sessionId,
      title: "New Chat",
      createdAt: new Date().toISOString(),
      threadId: `thread_${sessionId}`, // Unique thread ID for CopilotKit
    };

    // Clear localStorage for this new session to ensure it starts empty
    const storageKey = user ? `chat_messages_${user.id}_${sessionId}` : `chat_messages_${sessionId}`;
    localStorage.removeItem(storageKey);
    console.log(`🗑️ Cleared storage for new session: ${storageKey}`);

    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
  };

  // Function to start editing a session title
  const startEditingTitle = (sessionId: string, currentTitle: string) => {
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  };

  // Function to save edited title
  const saveEditedTitle = () => {
    if (editingSessionId && editingTitle.trim()) {
      setSessions(sessions.map(session =>
        session.id === editingSessionId
          ? { ...session, title: editingTitle.trim() }
          : session
      ));
    }
    setEditingSessionId(null);
    setEditingTitle("");
  };

  // Function to cancel editing
  const cancelEditingTitle = () => {
    setEditingSessionId(null);
    setEditingTitle("");
  };

  // Function to delete a chat session
  const deleteSession = () => {
    if (!deleteConfirmation) return;

    setSessions(prevSessions => {
      const newSessions = prevSessions.filter(session => session.id !== deleteConfirmation.sessionId);

      // Also delete messages for this session
      localStorage.removeItem(`chat_messages_${deleteConfirmation.sessionId}`);

      // If we deleted the active session, switch to the first available session
      if (deleteConfirmation.sessionId === activeSessionId && newSessions.length > 0) {
        setActiveSessionId(newSessions[0].id);
      } else if (deleteConfirmation.sessionId === activeSessionId && newSessions.length === 0) {
        // If the last session was deleted, create a new one
        const newDefaultSessionId = "1"; // Or generate a new one
        const newDefaultSession: ChatSession = {
          id: newDefaultSessionId,
          title: "New Chat",
          createdAt: new Date().toISOString(),
          threadId: `thread_${newDefaultSessionId}`,
        };
        setSessions([newDefaultSession]);
        setActiveSessionId(newDefaultSession.id);
        return [newDefaultSession]; // Return the new session for the state update
      }

      return newSessions;
    });

    setDeleteConfirmation(null);
  };

  // Function to handle delete confirmation
  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  // Function to open source modal from chat message
  const handleSourceClick = (source: { title: string; url: string; snippet: string }) => {
    setModalSource(source);
    setIsModalOpen(true);
  };

  // Make handleSourceClick available globally for click handlers
  if (typeof window !== "undefined") {
    (window as any).handleSourceClick = handleSourceClick;
  }

  return (
    <main className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Chat History - Now Resizable */}
      <aside
        className="bg-white border-r border-gray-200 flex flex-col relative"
        style={{ width: `${sidebarWidth}px`, minWidth: '200px', maxWidth: '500px' }}
      >
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
            Chat History
          </h2>
          <div className="space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`relative group px-3 py-2 rounded-lg transition-colors ${activeSessionId === session.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <button
                  onClick={() => setActiveSessionId(session.id)}
                  className="w-full flex items-center gap-3 text-left"
                  disabled={editingSessionId === session.id}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {editingSessionId === session.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            saveEditedTitle();
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelEditingTitle();
                          }
                        }}
                        onBlur={saveEditedTitle}
                        autoFocus
                        className="w-full text-sm font-medium px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <p className="text-sm font-medium truncate">{session.title}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </button>

                {/* Action buttons - only show on hover */}
                {editingSessionId !== session.id && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Edit button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingTitle(session.id, session.title);
                      }}
                      className="p-1 rounded hover:bg-blue-100 hover:text-blue-600 transition-all"
                      title="Rename chat"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Delete button - only show if not the only session */}
                    {sessions.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmation({ sessionId: session.id, sessionTitle: session.title });
                        }}
                        className="p-1 rounded hover:bg-red-100 hover:text-red-600 transition-all"
                        title="Delete chat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p className="font-medium mb-1">Google ADK + CopilotKit</p>
            <p>AI-powered search assistant</p>
          </div>
        </div>

        {/* Resize Handle - Made wider for easier grabbing */}
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-gray-200 hover:bg-blue-500 hover:w-1 transition-all z-10"
          style={{ width: isResizing ? '4px' : '4px' }}
          onMouseDown={() => setIsResizing(true)}
          title="Drag to resize sidebar"
        />
      </aside>

      {/* Main Content - Chat Interface */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Search Assistant</h1>
            <p className="text-sm text-gray-600 mt-1">
              I can do financial analysis on stocks or answer general questions
            </p>
          </div>

          {/* Login Button or User Avatar */}
          <div>
            {user ? (
              <UserAvatar />
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {/* Chart Selection Indicator - Compact and centered at TOP */}
          {selectedData && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-3 shadow-lg animate-in slide-in-from-top-4 duration-200 max-w-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xl">📊</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {selectedData.name} <span className="text-gray-500 font-normal">(value: {selectedData.value})</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      💬 Suggested: "{getQuestionTemplate()}"
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getQuestionTemplate());
                      // Visual feedback could be added here
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                    title="Copy suggested question"
                  >
                    Copy Question
                  </button>
                  <button
                    onClick={clearSelection}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-white/50 transition-colors"
                    title="Clear selection"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {mounted && (
            <CopilotKit
              runtimeUrl="/api/copilotkit"
              agent="search_agent"
              threadId={sessions.find(s => s.id === activeSessionId)?.threadId}
            >
              <ChatManager sessionId={activeSessionId} userId={user?.id} />
              <DebugPanel sessionId={activeSessionId} userId={user?.id} />
              <ChartInjector />
              <FinancialSuggestions />
              <ChatAutocomplete />
              <CopilotChat
                key={activeSessionId}
                className="h-full"
                instructions="You are a financial advisory assistant with Google search capabilities. For stock tickers, provide comprehensive financial analysis. For general questions, use Google search."
                labels={{
                  title: "Financial Advisory Assistant",
                  initial: "Hi! 👋 I can provide comprehensive financial advice for stock tickers (e.g., 'AAPL', 'MSFT') OR search Google for general questions. What would you like to know?",
                  placeholder: selectedData ? getQuestionTemplate() : "Ask about a stock ticker or any general question...",
                }}
                onSubmitMessage={(message: string) => {
                  console.log("Message submitted:", message);
                  // Clear chart selection after message is sent
                  clearSelection();
                }}
              />
            </CopilotKit>
          )}
        </div>
      </div>

      {/* Source Modal */}
      <SourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        source={modalSource}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Delete Chat
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{deleteConfirmation.sessionTitle}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteSession}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </main>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <ChartProvider>
        <HomeContent />
      </ChartProvider>
    </AuthProvider>
  );
}
