import { useState, useRef, useEffect } from 'react';
import { chatAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import {
    Send,
    Loader2,
    MessageSquare,
    User,
    Bot,
    Plus,
    Trash2,
    ChevronDown,
    FileText,
    Sparkles
} from 'lucide-react';

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [showSessions, setShowSessions] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchSessions = async () => {
        try {
            const data = await chatAPI.getSessions();
            setSessions(data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    };

    const loadSession = async (sid) => {
        try {
            const history = await chatAPI.getHistory(sid);
            setSessionId(sid);
            setMessages(history.messages.map(m => ({
                role: m.role,
                content: m.content,
                timestamp: m.timestamp
            })));
            setShowSessions(false);
        } catch (error) {
            console.error('Error loading session:', error);
        }
    };

    const startNewChat = () => {
        setSessionId(null);
        setMessages([]);
        setShowSessions(false);
    };

    const deleteSession = async (sid, e) => {
        e.stopPropagation();
        try {
            await chatAPI.deleteSession(sid);
            setSessions(sessions.filter(s => s.session_id !== sid));
            if (sessionId === sid) {
                startNewChat();
            }
        } catch (error) {
            console.error('Error deleting session:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');

        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await chatAPI.sendMessage(userMessage, sessionId);

            if (!sessionId) {
                setSessionId(response.session_id);
                fetchSessions();
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.message,
                sources: response.sources
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                error: true
            }]);
        } finally {
            setLoading(false);
        }
    };

    const suggestedQuestions = [
        "Summarize my uploaded documents",
        "Explain the main concepts",
        "Give me 5 MCQs for practice",
        "What are the key points to remember?"
    ];

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            Chat with AI
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Ask questions about your study materials
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={startNewChat}
                        className="btn-secondary flex items-center gap-2 py-2 px-4"
                    >
                        <Plus className="w-4 h-4" />
                        New Chat
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowSessions(!showSessions)}
                            className="btn-secondary flex items-center gap-2 py-2 px-4"
                        >
                            History
                            <ChevronDown className={`w-4 h-4 transition-transform ${showSessions ? 'rotate-180' : ''}`} />
                        </button>

                        {showSessions && (
                            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto z-10">
                                {sessions.length > 0 ? (
                                    sessions.map((session) => (
                                        <div
                                            key={session.session_id}
                                            onClick={() => loadSession(session.session_id)}
                                            className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {session.preview || 'Chat session'}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(session.updated_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => deleteSession(session.session_id, e)}
                                                className="p-1 text-gray-400 hover:text-red-500"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                                        No chat history yet
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 glass-card overflow-hidden flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-4">
                            <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center mb-6">
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                How can I help you today?
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
                                Ask me anything about your uploaded study materials. I'll provide answers based on your content.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                                {suggestedQuestions.map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setInput(question)}
                                        className="text-left p-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            {question}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
                                            <Bot className="w-4 h-4 text-white" />
                                        </div>
                                    )}

                                    <div className={message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}>
                                        {message.role === 'assistant' ? (
                                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                                <ReactMarkdown>{message.content}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <p>{message.content}</p>
                                        )}

                                        {/* Sources */}
                                        {message.sources && message.sources.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                    Sources:
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {message.sources.map((source, i) => (
                                                        <span
                                                            key={i}
                                                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                                        >
                                                            <FileText className="w-3 h-3" />
                                                            {source.filename}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {message.role === 'user' && (
                                        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {loading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="chat-bubble-assistant">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="text-sm">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question about your study materials..."
                            className="input-field flex-1"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="btn-primary px-4"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
