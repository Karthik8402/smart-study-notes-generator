import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uploadAPI, notesAPI, chatAPI } from '../services/api';
import {
    Upload,
    FileText,
    MessageSquare,
    BookOpen,
    TrendingUp,
    Clock,
    Sparkles,
    ArrowRight,
    FolderOpen,
    Brain
} from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        documents: 0,
        notes: 0,
        sessions: 0
    });
    const [recentDocs, setRecentDocs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [docs, notes, sessions] = await Promise.all([
                uploadAPI.getDocuments(),
                notesAPI.getAll(),
                chatAPI.getSessions()
            ]);

            setStats({
                documents: docs.length,
                notes: notes.length,
                sessions: sessions.length
            });

            setRecentDocs(docs.slice(0, 5));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            icon: FolderOpen,
            label: 'Documents',
            value: stats.documents,
            color: 'from-blue-500 to-blue-600',
            link: '/upload'
        },
        {
            icon: FileText,
            label: 'Generated Notes',
            value: stats.notes,
            color: 'from-green-500 to-green-600',
            link: '/notes'
        },
        {
            icon: MessageSquare,
            label: 'Chat Sessions',
            value: stats.sessions,
            color: 'from-purple-500 to-purple-600',
            link: '/chat'
        }
    ];

    const quickActions = [
        {
            icon: Upload,
            title: 'Upload Files',
            description: 'Add new study materials',
            link: '/upload',
            color: 'bg-primary-500'
        },
        {
            icon: MessageSquare,
            title: 'Ask AI',
            description: 'Chat with your content',
            link: '/chat',
            color: 'bg-accent-500'
        },
        {
            icon: Sparkles,
            title: 'Generate Notes',
            description: 'Create summaries & MCQs',
            link: '/notes',
            color: 'bg-green-500'
        }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Section */}
            <div className="glass-card p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                            Welcome back, {user?.name?.split(' ')[0] || 'Student'}! 👋
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Ready to continue your learning journey?
                        </p>
                    </div>
                    <Link to="/upload" className="btn-primary flex items-center gap-2 w-fit">
                        <Upload className="w-5 h-5" />
                        Upload New Material
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.map((stat, index) => (
                    <Link
                        key={index}
                        to={stat.link}
                        className="card group hover:border-primary-200 dark:hover:border-primary-800"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {stat.label}
                                </p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {loading ? '...' : stat.value}
                                </p>
                            </div>
                        </div>
                        <ArrowRight className="absolute top-6 right-6 w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickActions.map((action, index) => (
                        <Link
                            key={index}
                            to={action.link}
                            className="card flex items-center gap-4 hover:border-primary-200 dark:hover:border-primary-800"
                        >
                            <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center`}>
                                <action.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {action.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {action.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Documents */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Recent Documents
                    </h2>
                    <Link to="/upload" className="text-primary-500 hover:text-primary-600 text-sm font-medium">
                        View all →
                    </Link>
                </div>

                {loading ? (
                    <div className="card p-8 text-center">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>
                ) : recentDocs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentDocs.map((doc) => (
                            <div key={doc.id} className="card">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                            {doc.filename}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {doc.file_type.toUpperCase()} • {doc.chunks_count} chunks
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card p-8 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                            <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            No documents yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            Upload your first study material to get started
                        </p>
                        <Link to="/upload" className="btn-primary inline-flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Upload Now
                        </Link>
                    </div>
                )}
            </div>

            {/* Tips Section */}
            <div className="glass-card p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                        <Brain className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            Study Tip 💡
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Upload all your study materials first, then use the chat feature to ask questions.
                            The AI will give you accurate answers based on your own content!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
