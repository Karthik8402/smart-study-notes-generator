import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    MessageSquare,
    FileText,
    Upload,
    Calendar,
    FolderOpen,
    HardDrive,
    BookOpen,
    X,
    Sparkles
} from 'lucide-react';

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'from-blue-500 to-cyan-500' },
    { path: '/upload', icon: Upload, label: 'Upload Files', color: 'from-emerald-500 to-teal-500' },
    { path: '/chat', icon: MessageSquare, label: 'Chat with AI', color: 'from-purple-500 to-pink-500' },
    { path: '/notes', icon: FileText, label: 'Generate Notes', color: 'from-orange-500 to-red-500' },
    { path: '/saved-notes', icon: BookOpen, label: 'Saved Notes', color: 'from-indigo-500 to-violet-500' },
    { path: '/calendar', icon: Calendar, label: 'Calendar', color: 'from-rose-500 to-pink-500' },
    { path: '/drive', icon: FolderOpen, label: 'Drive', color: 'from-cyan-500 to-blue-500' },
    { path: '/filesystem', icon: HardDrive, label: 'Filesystem', color: 'from-yellow-500 to-orange-500' },
];

export default function Sidebar({ isOpen, onClose }) {
    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 z-40
                    bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl
                    border-r border-gray-200/50 dark:border-gray-800/50
                    transform transition-transform duration-300 ease-out
                    lg:translate-x-0
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="flex flex-col h-full p-4">
                    {/* Close button for mobile */}
                    <button
                        onClick={onClose}
                        className="lg:hidden absolute top-4 right-4 p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1.5 mt-2 overflow-y-auto hide-scrollbar">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className={({ isActive }) => `
                                    group flex items-center gap-3 px-4 py-3 rounded-xl
                                    font-medium transition-all duration-200
                                    ${isActive
                                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                                    }
                                `}
                            >
                                <div className={({ isActive }) => `
                                    p-1.5 rounded-lg transition-colors
                                    ${!isActive && `bg-gradient-to-br ${item.color} bg-opacity-10`}
                                `}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Bottom section */}
                    <div className="pt-4 mt-4 border-t border-gray-200/50 dark:border-gray-800/50">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 border border-purple-500/20 dark:border-purple-500/10">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-purple-500" />
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                    Pro Tip
                                </h4>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                Upload your study materials and ask questions to get personalized explanations!
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

