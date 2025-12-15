import { useState, useEffect } from 'react';
import { notesAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import {
    FileText,
    BookOpen,
    HelpCircle,
    Lightbulb,
    List,
    Loader2,
    Save,
    Trash2,
    ChevronDown,
    Sparkles,
    Check,
    X,
    Search
} from 'lucide-react';

const noteTypes = [
    { id: 'summary', label: 'Summary', icon: FileText, description: 'Condensed overview' },
    { id: 'topic_notes', label: 'Topic Notes', icon: BookOpen, description: 'Organized by topic' },
    { id: 'mcqs', label: 'MCQs', icon: HelpCircle, description: 'Practice questions' },
    { id: 'explanation', label: 'Explanation', icon: Lightbulb, description: 'Simple explanations' },
    { id: 'definitions', label: 'Definitions', icon: List, description: 'Key terms' },
];

export default function Notes() {
    const [selectedType, setSelectedType] = useState('summary');
    const [topic, setTopic] = useState('');
    const [numMcqs, setNumMcqs] = useState(5);
    const [loading, setLoading] = useState(false);
    const [generatedNote, setGeneratedNote] = useState(null);
    const [savedNotes, setSavedNotes] = useState([]);
    const [activeTab, setActiveTab] = useState('generate');
    const [saving, setSaving] = useState(false);
    const [showMcqAnswers, setShowMcqAnswers] = useState({});

    useEffect(() => {
        fetchSavedNotes();
    }, []);

    const fetchSavedNotes = async () => {
        try {
            const notes = await notesAPI.getAll();
            setSavedNotes(notes);
        } catch (error) {
            console.error('Error fetching notes:', error);
        }
    };

    const handleGenerate = async () => {
        if (selectedType === 'explanation' && !topic.trim()) {
            alert('Please enter a topic for explanation');
            return;
        }

        setLoading(true);
        setGeneratedNote(null);

        try {
            const note = await notesAPI.generate(
                selectedType,
                topic || null,
                selectedType === 'mcqs' ? numMcqs : 5
            );
            setGeneratedNote(note);
        } catch (error) {
            console.error('Error generating notes:', error);
            alert('Failed to generate notes. Make sure you have uploaded some documents first.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!generatedNote) return;

        setSaving(true);
        try {
            await notesAPI.save(generatedNote);
            await fetchSavedNotes();
            alert('Note saved successfully!');
        } catch (error) {
            console.error('Error saving note:', error);
            alert('Failed to save note');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (noteId) => {
        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            await notesAPI.delete(noteId);
            setSavedNotes(savedNotes.filter(n => n.id !== noteId));
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    const toggleMcqAnswer = (index) => {
        setShowMcqAnswers(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header with Glassmorphism - matching Calendar style */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-blue-600/20 border border-white/10 backdrop-blur-xl p-6">
                <div className="absolute inset-0 bg-grid-white/5"></div>
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                AI Notes Generator
                            </h1>
                            <p className="text-gray-400 mt-1">
                                Generate study materials from your uploaded content
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="group px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            {loading ? 'Generating...' : 'Generate Notes'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('generate')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${activeTab === 'generate'
                        ? 'text-primary-600 border-primary-600'
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                        }`}
                >
                    Generate New
                </button>
                <button
                    onClick={() => setActiveTab('saved')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${activeTab === 'saved'
                        ? 'text-primary-600 border-primary-600'
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                        }`}
                >
                    Saved Notes ({savedNotes.length})
                </button>
            </div>

            {activeTab === 'generate' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Controls */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="card">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                                Note Type
                            </h3>
                            <div className="space-y-2">
                                {noteTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setSelectedType(type.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedType === type.id
                                            ? 'bg-primary-50 dark:bg-primary-900/50 border-2 border-primary-500'
                                            : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                            }`}
                                    >
                                        <type.icon className={`w-5 h-5 ${selectedType === type.id
                                            ? 'text-primary-600 dark:text-primary-400'
                                            : 'text-gray-500'
                                            }`} />
                                        <div className="text-left">
                                            <p className={`font-medium ${selectedType === type.id
                                                ? 'text-primary-700 dark:text-primary-300'
                                                : 'text-gray-700 dark:text-gray-300'
                                                }`}>
                                                {type.label}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {type.description}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                                Options
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Topic (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g., Operating Systems, Data Structures"
                                        className="input-field"
                                    />
                                </div>

                                {selectedType === 'mcqs' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Number of Questions
                                        </label>
                                        <select
                                            value={numMcqs}
                                            onChange={(e) => setNumMcqs(Number(e.target.value))}
                                            className="input-field"
                                        >
                                            {[5, 10, 15, 20].map(n => (
                                                <option key={n} value={n}>{n} questions</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Generate {noteTypes.find(t => t.id === selectedType)?.label}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Output */}
                    <div className="lg:col-span-2">
                        <div className="card min-h-[500px]">
                            {loading ? (
                                <div className="h-96 flex flex-col items-center justify-center">
                                    <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Generating your {noteTypes.find(t => t.id === selectedType)?.label.toLowerCase()}...
                                    </p>
                                </div>
                            ) : generatedNote ? (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {generatedNote.title}
                                        </h2>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="btn-primary flex items-center gap-2"
                                        >
                                            {saving ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Save
                                        </button>
                                    </div>

                                    {generatedNote.mcqs ? (
                                        <div className="space-y-6">
                                            {generatedNote.mcqs.map((mcq, index) => (
                                                <div key={index} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                                                    <p className="font-medium text-gray-900 dark:text-white mb-3">
                                                        {index + 1}. {mcq.question}
                                                    </p>
                                                    <div className="space-y-2 mb-3">
                                                        {mcq.options.map((option, optIndex) => (
                                                            <div
                                                                key={optIndex}
                                                                className={`p-2 rounded-lg ${showMcqAnswers[index] && option === mcq.correct_answer
                                                                    ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                                                                    : 'bg-white dark:bg-gray-700'
                                                                    }`}
                                                            >
                                                                {option}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={() => toggleMcqAnswer(index)}
                                                        className="text-sm text-primary-600 hover:text-primary-700"
                                                    >
                                                        {showMcqAnswers[index] ? 'Hide Answer' : 'Show Answer'}
                                                    </button>
                                                    {showMcqAnswers[index] && mcq.explanation && (
                                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                            <strong>Explanation:</strong> {mcq.explanation}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="prose prose-lg dark:prose-invert max-w-none">
                                            <ReactMarkdown>{generatedNote.content}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-96 flex flex-col items-center justify-center text-center px-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6">
                                        <Search className="w-8 h-8 text-purple-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                        Generate {noteTypes.find(t => t.id === selectedType)?.label}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                                        Enter a topic (optional) and click Generate to create AI-powered study materials from your uploaded documents.
                                    </p>

                                    {/* Topic Search Input */}
                                    <div className="w-full max-w-md space-y-4">
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={topic}
                                                onChange={(e) => setTopic(e.target.value)}
                                                placeholder="Enter a topic (e.g., Operating Systems, Data Structures)"
                                                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                            />
                                        </div>

                                        {selectedType === 'mcqs' && (
                                            <select
                                                value={numMcqs}
                                                onChange={(e) => setNumMcqs(Number(e.target.value))}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                            >
                                                {[5, 10, 15, 20].map(n => (
                                                    <option key={n} value={n}>{n} questions</option>
                                                ))}
                                            </select>
                                        )}

                                        <button
                                            onClick={handleGenerate}
                                            disabled={loading}
                                            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-5 h-5" />
                                                    Generate {noteTypes.find(t => t.id === selectedType)?.label}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Saved Notes Tab */
                <div>
                    {savedNotes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {savedNotes.map((note) => (
                                <div key={note.id} className="card">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {noteTypes.find(t => t.id === note.note_type)?.icon && (
                                                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                                                    {(() => {
                                                        const Icon = noteTypes.find(t => t.id === note.note_type)?.icon;
                                                        return Icon ? <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" /> : null;
                                                    })()}
                                                </div>
                                            )}
                                            <span className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase">
                                                {note.note_type.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(note.id)}
                                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                        {note.title}
                                    </h3>

                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                                        {note.mcqs
                                            ? `${note.mcqs.length} multiple choice questions`
                                            : note.content.substring(0, 150) + '...'
                                        }
                                    </p>

                                    <p className="text-xs text-gray-400 mt-3">
                                        {new Date(note.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card p-12 text-center">
                            <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
                                <FileText className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                No saved notes yet
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                Generate and save notes to see them here
                            </p>
                            <button
                                onClick={() => setActiveTab('generate')}
                                className="btn-primary inline-flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                Generate Notes
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

