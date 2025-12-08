import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    BookOpen,
    Brain,
    FileText,
    MessageSquare,
    Upload,
    Calendar,
    Sparkles,
    ArrowRight,
    Check
} from 'lucide-react';

const features = [
    {
        icon: Upload,
        title: 'Multi-format Upload',
        description: 'Upload PDFs, PowerPoints, images, or YouTube links'
    },
    {
        icon: Brain,
        title: 'AI-Powered RAG',
        description: 'Get accurate answers from your own study materials'
    },
    {
        icon: FileText,
        title: 'Auto-generated Notes',
        description: 'Create summaries, topic notes, MCQs, and more'
    },
    {
        icon: MessageSquare,
        title: 'Chat with AI',
        description: 'Ask questions and get personalized explanations'
    },
    {
        icon: Calendar,
        title: 'Study Reminders',
        description: 'Set reminders and organize your study schedule'
    },
    {
        icon: Sparkles,
        title: 'Smart Organization',
        description: 'Keep all your notes organized and accessible'
    },
];

export default function Home() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Hero Section */}
            <header className="relative overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-full blur-3xl" />

                <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold gradient-text">StudyAI</span>
                        </div>

                        <div className="flex items-center gap-4">
                            {isAuthenticated ? (
                                <Link to="/dashboard" className="btn-primary">
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                                    >
                                        Sign in
                                    </Link>
                                    <Link to="/register" className="btn-primary">
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8">
                            <Sparkles className="w-4 h-4" />
                            Powered by AI + RAG + MCP
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                            Smart Study Notes
                            <span className="block gradient-text">Generator & Organizer</span>
                        </h1>

                        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10">
                            Upload your study materials, ask questions, and let AI generate
                            summaries, topic notes, MCQs, and more. Study smarter, not harder.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/register" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
                                Start Learning Free
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link to="/login" className="btn-secondary flex items-center gap-2 text-lg px-8 py-4">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section className="py-20 lg:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="section-heading">
                            Everything You Need to
                            <span className="gradient-text"> Study Smarter</span>
                        </h2>
                        <p className="section-subheading">
                            Our AI-powered platform helps you understand your study materials better
                            and prepare for exams more effectively.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="feature-card p-8"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mb-6">
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 lg:py-32 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="section-heading">
                            How It <span className="gradient-text">Works</span>
                        </h2>
                        <p className="section-subheading">
                            Get started in just a few simple steps
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { step: '1', title: 'Upload Materials', desc: 'Upload your PDFs, PPTs, images, or YouTube links' },
                            { step: '2', title: 'Ask Questions', desc: 'Chat with AI about your study materials' },
                            { step: '3', title: 'Generate Notes', desc: 'Create summaries, MCQs, and organized notes' },
                        ].map((item, index) => (
                            <div key={index} className="relative text-center">
                                <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {item.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 lg:py-32">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="glass-card p-12 lg:p-16">
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                            Ready to Study Smarter?
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                            Join thousands of students who are already using AI to ace their exams.
                        </p>
                        <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
                            Get Started Free
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold gradient-text">StudyAI</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            © 2024 Smart Study Notes Generator. Built with ❤️ for students.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
