import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    BookOpen,
    Brain,
    FileText,
    MessageSquare,
    Upload,
    Calendar,
    Sparkles,
    ArrowRight,
    Check,
    Star,
    Zap,
    Shield,
    Sun,
    Moon,
    ChevronRight,
    Play
} from 'lucide-react';
import { useState, useEffect } from 'react';

const features = [
    {
        icon: Upload,
        title: 'Multi-format Upload',
        description: 'Upload PDFs, PowerPoints, images, or YouTube links',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        icon: Brain,
        title: 'AI-Powered RAG',
        description: 'Get accurate answers from your own study materials',
        color: 'from-purple-500 to-pink-500'
    },
    {
        icon: FileText,
        title: 'Auto-generated Notes',
        description: 'Create summaries, topic notes, MCQs, and more',
        color: 'from-emerald-500 to-teal-500'
    },
    {
        icon: MessageSquare,
        title: 'Chat with AI',
        description: 'Ask questions and get personalized explanations',
        color: 'from-orange-500 to-red-500'
    },
    {
        icon: Calendar,
        title: 'Study Scheduler',
        description: 'Organize your study schedule efficiently',
        color: 'from-indigo-500 to-violet-500'
    },
    {
        icon: Shield,
        title: 'Secure & Private',
        description: 'Your data is encrypted and never shared',
        color: 'from-rose-500 to-pink-500'
    },
];

const stats = [
    { value: '10K+', label: 'Students' },
    { value: '50K+', label: 'Notes Generated' },
    { value: '98%', label: 'Satisfaction' },
    { value: '24/7', label: 'AI Support' },
];

export default function Home() {
    const { isAuthenticated } = useAuth();
    const { theme, toggleTheme, isDark } = useTheme();
    const [animatedText, setAnimatedText] = useState(0);

    const textOptions = ['Smarter', 'Faster', 'Better', 'Efficiently'];

    useEffect(() => {
        const interval = setInterval(() => {
            setAnimatedText(prev => (prev + 1) % textOptions.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-blob" />
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
                <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500/20 dark:bg-pink-500/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
            </div>

            {/* Navigation */}
            <nav className="relative z-50 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all duration-300">
                                    <BookOpen className="w-6 h-6 text-white" />
                                </div>
                                <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-30 blur-lg transition-all duration-300" />
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                                StudyAI
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Theme toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
                            >
                                <div className="relative w-5 h-5">
                                    <Sun className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${isDark ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
                                    <Moon className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${isDark ? '-rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
                                </div>
                            </button>

                            {isAuthenticated ? (
                                <Link
                                    to="/dashboard"
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="px-5 py-2.5 text-gray-700 dark:text-gray-300 font-medium hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        Sign in
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all duration-300"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-20 lg:pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-4xl mx-auto">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-8 animate-fadeIn">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                Powered by AI + RAG + MCP Technology
                            </span>
                        </div>

                        {/* Main heading */}
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 animate-fadeIn animation-delay-100">
                            Study{' '}
                            <span className="relative inline-block">
                                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent animate-text-shimmer">
                                    {textOptions[animatedText]}
                                </span>
                            </span>
                            <br />
                            with AI Notes
                        </h1>

                        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 animate-fadeIn animation-delay-200">
                            Upload your study materials, ask questions, and let AI generate
                            summaries, topic notes, MCQs, and more. The future of learning is here.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeIn animation-delay-300">
                            <Link
                                to="/register"
                                className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold text-lg shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
                            >
                                Start Learning Free
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <button className="group px-8 py-4 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2">
                                <Play className="w-5 h-5" />
                                Watch Demo
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 animate-fadeIn animation-delay-400">
                            {stats.map((stat, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                                        {stat.value}
                                    </div>
                                    <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative py-20 lg:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Everything You Need to{' '}
                            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                                Excel
                            </span>
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Our AI-powered platform helps you understand and retain information better
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group p-6 bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-transparent hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:-translate-y-2"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
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
            <section className="relative py-20 lg:py-32 bg-gradient-to-b from-transparent via-gray-100/50 to-transparent dark:via-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            How It{' '}
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Works</span>
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Get started in just 3 simple steps
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { step: '1', title: 'Upload Materials', desc: 'Upload your PDFs, PPTs, images, or YouTube links', icon: Upload },
                            { step: '2', title: 'Ask Questions', desc: 'Chat with AI about your study materials', icon: MessageSquare },
                            { step: '3', title: 'Generate Notes', desc: 'Create summaries, MCQs, and organized notes', icon: FileText },
                        ].map((item, index) => (
                            <div key={index} className="relative text-center group">
                                {index < 2 && (
                                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-gray-300 dark:border-gray-700" />
                                )}
                                <div className="relative inline-block mb-6">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/25 group-hover:shadow-purple-500/40 group-hover:scale-110 transition-all duration-300">
                                        <item.icon className="w-9 h-9 text-white" />
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-gray-900 border-2 border-purple-500 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
                                        {item.step}
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
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
            <section className="relative py-20 lg:py-32">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-12 lg:p-16 shadow-2xl">
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                        </div>

                        <div className="relative text-center">
                            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                                Ready to Transform Your Learning?
                            </h2>
                            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                                Join thousands of students who are already using AI to ace their exams and study more effectively.
                            </p>
                            <Link
                                to="/register"
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-purple-600 font-semibold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                            >
                                Get Started Free
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative py-12 border-t border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                StudyAI
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            © 2024 Smart Study Notes Generator. Built with ❤️ for students.
                        </p>
                    </div>
                </div>
            </footer>

        </div>
    );
}

