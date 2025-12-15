import { useState, useRef, useEffect } from 'react';
import { chatAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
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
    Sparkles,
    Download,
    FileType,
    File
} from 'lucide-react';

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [showSessions, setShowSessions] = useState(false);
    const [exportDropdown, setExportDropdown] = useState(null);
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

    // Export chat history to PDF
    const exportChatToPDF = async (session, e) => {
        e.stopPropagation();
        try {
            const history = await chatAPI.getHistory(session.session_id);
            const chatMessages = history.messages || [];

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let yPos = 20;

            const checkNewPage = (requiredSpace = 20) => {
                if (yPos > pageHeight - 40 - requiredSpace) {
                    doc.addPage();
                    yPos = 20;
                }
            };

            // Header
            doc.setFillColor(124, 58, 237);
            doc.rect(0, 0, pageWidth, 35, 'F');
            doc.setFillColor(167, 139, 250);
            doc.rect(0, 33, pageWidth, 4, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.text('💬 Chat Conversation', 15, 18);

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            const dateStr = new Date(session.updated_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            doc.text(dateStr, 15, 28);

            yPos = 50;

            // Chat messages
            chatMessages.forEach((msg, idx) => {
                checkNewPage(40);

                const isUser = msg.role === 'user';

                // Role badge
                if (isUser) {
                    doc.setFillColor(79, 70, 229);
                } else {
                    doc.setFillColor(16, 185, 129);
                }
                doc.roundedRect(15, yPos - 4, 30, 10, 2, 2, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(8);
                doc.setFont(undefined, 'bold');
                doc.text(isUser ? 'YOU' : 'AI', 25, yPos + 2);

                yPos += 12;

                // Message content
                doc.setTextColor(55, 65, 81);
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');

                const cleanContent = msg.content
                    .replace(/\*\*(.*?)\*\*/g, '$1')
                    .replace(/\*(.*?)\*/g, '$1')
                    .replace(/`(.*?)`/g, '$1')
                    .replace(/#{1,6}\s/g, '');

                const contentLines = doc.splitTextToSize(cleanContent, pageWidth - 35);

                contentLines.forEach(line => {
                    checkNewPage(8);
                    doc.text(line, 20, yPos);
                    yPos += 5;
                });

                yPos += 8;

                // Separator
                if (idx < chatMessages.length - 1) {
                    doc.setDrawColor(229, 231, 235);
                    doc.setLineWidth(0.3);
                    doc.line(15, yPos, pageWidth - 15, yPos);
                    yPos += 8;
                }
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setDrawColor(229, 231, 235);
                doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
                doc.setFontSize(8);
                doc.setTextColor(156, 163, 175);
                doc.text('📚 Smart Study Notes - Chat Export', 15, pageHeight - 8);
                doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
            }

            doc.save(`Chat_${new Date().toISOString().split('T')[0]}.pdf`);
            setExportDropdown(null);
        } catch (error) {
            console.error('Error exporting chat to PDF:', error);
        }
    };

    // Export chat history to Word
    const exportChatToWord = async (session, e) => {
        e.stopPropagation();
        try {
            const history = await chatAPI.getHistory(session.session_id);
            const chatMessages = history.messages || [];

            const children = [];

            // Title
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: '💬 Chat Conversation',
                            bold: true,
                            size: 48,
                            color: '7C3AED',
                        }),
                    ],
                    spacing: { after: 100 },
                    border: {
                        bottom: { color: '7C3AED', style: BorderStyle.SINGLE, size: 12 },
                    },
                })
            );

            // Date
            const dateStr = new Date(session.updated_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: dateStr,
                            size: 20,
                            color: '6B7280',
                            italics: true,
                        }),
                    ],
                    spacing: { after: 400 },
                })
            );

            // Messages
            chatMessages.forEach((msg) => {
                const isUser = msg.role === 'user';

                // Role header
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: isUser ? '👤 You' : '🤖 AI Assistant',
                                bold: true,
                                size: 24,
                                color: isUser ? '4F46E5' : '10B981',
                            }),
                        ],
                        spacing: { before: 300, after: 100 },
                        shading: { fill: isUser ? 'EEF2FF' : 'ECFDF5' },
                    })
                );

                // Message content
                const cleanContent = msg.content
                    .replace(/\*\*(.*?)\*\*/g, '$1')
                    .replace(/\*(.*?)\*/g, '$1')
                    .replace(/`(.*?)`/g, '$1');

                const paragraphs = cleanContent.split('\n');
                paragraphs.forEach(para => {
                    if (para.trim()) {
                        children.push(
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: para.trim(),
                                        size: 22,
                                        color: '374151',
                                    }),
                                ],
                                indent: { left: 200 },
                                spacing: { after: 80 },
                            })
                        );
                    }
                });
            });

            // Footer
            children.push(
                new Paragraph({
                    spacing: { before: 400 },
                    border: {
                        bottom: { color: 'D1D5DB', style: BorderStyle.SINGLE, size: 12 },
                    },
                })
            );

            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: '📚 Exported from Smart Study Notes',
                            italics: true,
                            size: 18,
                            color: '9CA3AF',
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200 },
                })
            );

            const wordDoc = new Document({
                sections: [{ properties: {}, children: children }],
            });

            const blob = await Packer.toBlob(wordDoc);
            saveAs(blob, `Chat_${new Date().toISOString().split('T')[0]}.docx`);
            setExportDropdown(null);
        } catch (error) {
            console.error('Error exporting chat to Word:', error);
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
            {/* Header with Theme Awareness */}
            <div className="relative overflow-hidden rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 backdrop-blur-xl p-6 mb-4 transition-colors duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5"></div>
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
                            <MessageSquare className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                                Chat with AI
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">
                                Ask questions about your study materials
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={startNewChat}
                            className="group px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                            New Chat
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowSessions(!showSessions)}
                                className="px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-white rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2 border border-gray-200 dark:border-gray-700"
                            >
                                History
                                <ChevronDown className={`w-4 h-4 transition-transform ${showSessions ? 'rotate-180' : ''}`} />
                            </button>

                            {showSessions && (
                                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-10">
                                    {sessions.length > 0 ? (
                                        sessions.map((session) => (
                                            <div
                                                key={session.session_id}
                                                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-0"
                                            >
                                                <div
                                                    onClick={() => loadSession(session.session_id)}
                                                    className="flex items-center justify-between cursor-pointer"
                                                >
                                                    <div className="flex-1 min-w-0 mr-2">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                            {session.preview || 'Chat session'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {new Date(session.updated_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {/* Export dropdown */}
                                                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setExportDropdown(exportDropdown === session.session_id ? null : session.session_id);
                                                                }}
                                                                className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition"
                                                                title="Export chat"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                            {exportDropdown === session.session_id && (
                                                                <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-20 animate-fadeIn">
                                                                    <button
                                                                        onClick={(e) => exportChatToPDF(session, e)}
                                                                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 transition"
                                                                    >
                                                                        <FileType className="w-4 h-4 text-red-500" />
                                                                        Export PDF
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => exportChatToWord(session, e)}
                                                                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-2 transition"
                                                                    >
                                                                        <File className="w-4 h-4 text-blue-500" />
                                                                        Export Word
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Delete button */}
                                                        <button
                                                            onClick={(e) => deleteSession(session.session_id, e)}
                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                                                            title="Delete chat"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
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
