import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uploadAPI, notesAPI } from '../services/api';
import {
    Upload,
    MessageSquare,
    FileText,
    Calendar,
    FolderOpen,
    TrendingUp,
    Clock,
    BookOpen,
    Sparkles,
    ArrowRight,
    ChevronRight,
    File,
    Zap
} from 'lucide-react';

const quickActions = [
    { icon: Upload, label: 'Upload Files', path: '/upload', color: 'from-emerald-500 to-teal-500', desc: 'Add study materials' },
    { icon: MessageSquare, label: 'Chat with AI', path: '/chat', color: 'from-purple-500 to-pink-500', desc: 'Ask questions' },
    { icon: FileText, label: 'Generate Notes', path: '/notes', color: 'from-orange-500 to-red-500', desc: 'Create summaries' },
    { icon: Calendar, label: 'Calendar', path: '/calendar', color: 'from-blue-500 to-cyan-500', desc: 'Plan your study' },
];

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        documents: 0,
        notes: 0,
        recentDocs: [],
        recentNotes: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [docs, notes] = await Promise.all([
                uploadAPI.getDocuments().catch(() => []),
                notesAPI.getAll().catch(() => [])
            ]);

            setStats({
                documents: docs.length || 0,
                notes: notes.length || 0,
                recentDocs: (docs || []).slice(0, 5),
                recentNotes: (notes || []).slice(0, 5)
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Welcome Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                </div>

                {/* Floating elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-yellow-300" />
                            <span className="text-white/80 text-sm font-medium">{getGreeting()}</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                            Welcome back, {user?.name?.split(' ')[0] || 'Student'}!
                        </h1>
                        <p className="text-white/80 text-lg">
                            Ready to continue your learning journey?
                        </p>
                    </div>
                    <Link
                        to="/upload"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 w-fit"
                    >
                        <Upload className="w-5 h-5" />
                        Upload New
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Documents', value: stats.documents, icon: File, color: 'from-blue-500 to-cyan-500' },
                    { label: 'Saved Notes', value: stats.notes, icon: BookOpen, color: 'from-purple-500 to-pink-500' },
                    { label: 'Study Hours', value: '12.5', icon: Clock, color: 'from-emerald-500 to-teal-500' },
                    { label: 'AI Chats', value: '45', icon: Zap, color: 'from-orange-500 to-red-500' },
                ].map((stat, i) => (
                    <div
                        key={i}
                        className="p-5 bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.label}</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action, i) => (
                        <Link
                            key={i}
                            to={action.path}
                            className="group p-5 bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-transparent hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                <action.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{action.label}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{action.desc}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Documents */}
                <div className="p-6 bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Documents</h3>
                        <Link to="/upload" className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
                            View all <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    {stats.recentDocs.length === 0 ? (
                        <div className="text-center py-8">
                            <File className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">No documents yet</p>
                            <Link to="/upload" className="text-sm text-purple-600 dark:text-purple-400 hover:underline mt-2 inline-block">
                                Upload your first document
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stats.recentDocs.map((doc, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <div className="p-2 rounded-lg bg-blue-500/10">
                                        <File className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.filename}</p>
                                        <p className="text-xs text-gray-500">{formatDate(doc.created_at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Notes */}
                <div className="p-6 bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Notes</h3>
                        <Link to="/saved-notes" className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
                            View all <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    {stats.recentNotes.length === 0 ? (
                        <div className="text-center py-8">
                            <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">No notes yet</p>
                            <Link to="/notes" className="text-sm text-purple-600 dark:text-purple-400 hover:underline mt-2 inline-block">
                                Generate your first note
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stats.recentNotes.map((note, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <div className="p-2 rounded-lg bg-purple-500/10">
                                        <FileText className="w-4 h-4 text-purple-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{note.title}</p>
                                        <p className="text-xs text-gray-500">{formatDate(note.created_at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

