import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    MessageSquare,
    FileText,
    Upload,
    Calendar,
    FolderOpen,
    X
} from 'lucide-react';

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/upload', icon: Upload, label: 'Upload Files' },
    { path: '/chat', icon: MessageSquare, label: 'Chat with AI' },
    { path: '/notes', icon: FileText, label: 'My Notes' },
];

export default function Sidebar({ isOpen, onClose }) {
    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 z-40
          bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
            >
                <div className="flex flex-col h-full p-4">
                    {/* Close button for mobile */}
                    <button
                        onClick={onClose}
                        className="lg:hidden absolute top-4 right-4 p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2 mt-4">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  font-medium transition-all duration-200
                  ${isActive
                                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }
                `}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Bottom section */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                        <div className="glass-card p-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Pro Tip 💡
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Upload your study materials and ask questions to get personalized explanations!
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
