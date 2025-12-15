import { useState, useEffect } from 'react';
import { notesAPI } from '../services/api';
import { FileText, Trash2, Download, Eye, Search, BookOpen, ListChecks, Lightbulb, GraduationCap, X, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const categories = [
    { id: null, name: 'All Notes', icon: FileText, color: 'from-purple-500 to-pink-500' },
    { id: 'summary', name: 'Summaries', icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
    { id: 'mcqs', name: 'MCQs', icon: ListChecks, color: 'from-green-500 to-emerald-500' },
    { id: 'explanation', name: 'Explanations', icon: Lightbulb, color: 'from-yellow-500 to-orange-500' },
    { id: 'topic_notes', name: 'Topics', icon: GraduationCap, color: 'from-red-500 to-pink-500' },
    { id: 'definitions', name: 'Definitions', icon: FileText, color: 'from-indigo-500 to-purple-500' },
];

export default function SavedNotes() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNote, setSelectedNote] = useState(null);

    useEffect(() => {
        fetchNotes();
    }, [selectedCategory]);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const data = await notesAPI.getAll(selectedCategory);
            setNotes(data || []);
        } catch (error) {
            console.error('Failed to fetch notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (note) => {
        let content = `# ${note.title}\n\n${note.content}`;

        // Add MCQs if present
        if (note.mcqs && note.mcqs.length > 0) {
            content += '\n\n## Questions\n\n';
            note.mcqs.forEach((mcq, idx) => {
                content += `### ${idx + 1}. ${mcq.question}\n\n`;
                mcq.options.forEach((opt, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    content += `${letter}. ${opt}\n`;
                });
                content += `\n**Answer:** ${mcq.correct_answer}\n`;
                if (mcq.explanation) {
                    content += `**Explanation:** ${mcq.explanation}\n`;
                }
                content += '\n';
            });
        }

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.title.replace(/[^a-z0-9]/gi, '_')}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDelete = async (noteId) => {
        if (!confirm('Delete this note?')) return;
        try {
            await notesAPI.delete(noteId);
            fetchNotes();
            if (selectedNote?.id === noteId) {
                setSelectedNote(null);
            }
        } catch (error) {
            alert('Failed to delete note');
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getCategoryInfo = (noteType) => {
        return categories.find(c => c.id === noteType) || categories[0];
    };

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.topic && note.topic.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading && notes.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-500/30 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-indigo-600/20 border border-white/10 backdrop-blur-xl p-6">
                <div className="absolute inset-0 bg-grid-white/5"></div>
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
                            <FileText className="w-8 h-8 text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                Saved Notes
                            </h1>
                            <p className="text-gray-700 dark:text-gray-600 dark:text-gray-400 mt-1">Your generated study materials</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50">
                            <span className="text-gray-700 dark:text-gray-600 dark:text-gray-400">Total: </span>
                            <span className="text-gray-900 dark:text-white font-semibold">{notes.length} notes</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Categories & Search */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex gap-2 flex-wrap">
                    {categories.map(cat => {
                        const Icon = cat.icon;
                        const isActive = selectedCategory === cat.id;
                        return (
                            <button
                                key={cat.id || 'all'}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${isActive
                                    ? `bg-gradient-to-r ${cat.color} text-gray-900 dark:text-white shadow-lg`
                                    : 'bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700/50'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {cat.name}
                            </button>
                        );
                    })}
                </div>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search notes..."
                        className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none w-64"
                    />
                </div>
            </div>

            {/* Notes Grid */}
            {filteredNotes.length === 0 ? (
                <div className="text-center py-16 bg-gray-100 dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700/50 border-dashed">
                    <FileText className="w-16 h-16 text-gray-700 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-700 dark:text-gray-600 dark:text-gray-400 text-lg">No saved notes found</p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                        Generate and save notes from the Notes page to see them here
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredNotes.map((note) => {
                        const catInfo = getCategoryInfo(note.note_type);
                        const Icon = catInfo.icon;
                        return (
                            <div
                                key={note.id}
                                className="group p-5 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${catInfo.color} bg-opacity-20 shrink-0`}>
                                        <Icon className="w-6 h-6 text-gray-900 dark:text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r ${catInfo.color} text-gray-900 dark:text-white mb-2`}>
                                            {note.note_type.replace('_', ' ').toUpperCase()}
                                        </span>
                                        <h3 className="text-gray-900 dark:text-white font-medium truncate" title={note.title}>
                                            {note.title}
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-500 text-sm mt-1 line-clamp-2">
                                            {note.mcqs ? `${note.mcqs.length} multiple choice questions` : note.content.substring(0, 100)}
                                        </p>
                                        <p className="text-gray-700 dark:text-gray-600 text-xs mt-2">
                                            {formatDate(note.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                                    <button
                                        onClick={() => setSelectedNote(note)}
                                        className="flex-1 px-3 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition flex items-center justify-center gap-1.5 text-sm"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </button>
                                    <button
                                        onClick={() => handleDownload(note)}
                                        className="px-3 py-2 bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600/30 transition"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(note.id)}
                                        className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Note Viewer Modal */}
            {selectedNote && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-gray-200 dark:border-gray-700/50 shadow-2xl animate-slideUp">
                        <div className="flex items-center justify-between p-4 border-b border-gray-700 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${getCategoryInfo(selectedNote.note_type).color}`}>
                                    <FileText className="w-5 h-5 text-gray-900 dark:text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-md">
                                        {selectedNote.title}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-500 text-sm">
                                        {selectedNote.note_type.replace('_', ' ')} • {formatDate(selectedNote.created_at)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDownload(selectedNote)}
                                    className="px-3 py-1.5 bg-emerald-600 text-gray-900 dark:text-white rounded-lg hover:bg-emerald-500 transition flex items-center gap-1.5 text-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                                <button
                                    onClick={() => setSelectedNote(null)}
                                    className="p-2 text-gray-700 dark:text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-700 rounded-lg transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            {selectedNote.mcqs && selectedNote.mcqs.length > 0 ? (
                                <div className="space-y-6">
                                    {selectedNote.mcqs.map((mcq, idx) => (
                                        <div key={idx} className="p-5 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50">
                                            <h4 className="text-gray-900 dark:text-white font-medium text-lg mb-4">
                                                {idx + 1}. {mcq.question}
                                            </h4>
                                            <div className="space-y-2 mb-4">
                                                {mcq.options.map((opt, optIdx) => {
                                                    const letter = String.fromCharCode(65 + optIdx);
                                                    const isCorrect = opt === mcq.correct_answer || letter === mcq.correct_answer;
                                                    return (
                                                        <div
                                                            key={optIdx}
                                                            className={`p-3 rounded-lg border flex items-center gap-3 ${isCorrect
                                                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                                                : 'bg-gray-700/30 border-gray-200 dark:border-gray-700/50 text-gray-300'
                                                                }`}
                                                        >
                                                            <span className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium">
                                                                {letter}
                                                            </span>
                                                            {opt}
                                                            {isCorrect && <CheckCircle className="w-4 h-4 ml-auto" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {mcq.explanation && (
                                                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                                    <p className="text-blue-400 text-sm">
                                                        <strong>Explanation:</strong> {mcq.explanation}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="prose prose-invert prose-purple max-w-none">
                                    <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}



