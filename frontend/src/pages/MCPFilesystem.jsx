import { useState, useEffect } from 'react';
import { mcpAPI } from '../services/api';
import { Folder, FileText, File, Upload, Trash2, Download, Search, Plus, ChevronRight, Home, RefreshCw } from 'lucide-react';

export default function MCPFilesystem() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPath, setCurrentPath] = useState('.');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchFiles();
    }, [currentPath]);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const data = await mcpAPI.listDirectory(currentPath);
            // Map API response: backend returns 'items' with 'type' field
            const entries = (data.items || []).map(item => ({
                ...item,
                is_directory: item.type === 'directory'
            }));
            setFiles(entries);
        } catch (error) {
            console.error('Failed to fetch files:', error);
            setFiles([]);
        } finally {
            setLoading(false);
        }
    };


    const navigateToFolder = (name) => {
        const newPath = currentPath === '.' ? name : `${currentPath}/${name}`;
        setCurrentPath(newPath);
    };

    const goBack = () => {
        if (currentPath === '.') return;
        const parts = currentPath.split('/');
        parts.pop();
        setCurrentPath(parts.length > 0 ? parts.join('/') : '.');
    };

    const goHome = () => {
        setCurrentPath('.');
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchFiles();
            return;
        }
        try {
            setLoading(true);
            const data = await mcpAPI.searchFiles(searchQuery, currentPath);
            setFiles(data.results || []);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFileIcon = (entry) => {
        if (entry.is_directory) return Folder;
        const ext = entry.name.split('.').pop()?.toLowerCase();
        if (['txt', 'md', 'json', 'js', 'py', 'html', 'css'].includes(ext)) return FileText;
        return File;
    };

    const formatSize = (bytes) => {
        if (!bytes) return '-';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    // Skeleton loading component for file rows
    const FileRowSkeleton = () => (
        <div className="p-4 flex items-center justify-between animate-pulse border-b border-gray-200 dark:border-gray-700/50 last:border-b-0">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
    );

    if (loading && files.length === 0) {
        return (
            <div className="space-y-6 animate-fadeIn">
                {/* Header Skeleton */}
                <div className="relative overflow-hidden rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 backdrop-blur-xl p-6">
                    <div className="flex items-center gap-4 animate-pulse">
                        <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        <div className="space-y-2">
                            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>
                </div>

                {/* File List Skeleton */}
                <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
                    <FileRowSkeleton />
                    <FileRowSkeleton />
                    <FileRowSkeleton />
                    <FileRowSkeleton />
                </div>
            </div>
        );
    }


    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 backdrop-blur-xl p-6 transition-colors duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-teal-500/5"></div>
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/25 shrink-0">
                            <Folder className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                                Filesystem
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300 text-sm md:text-base">
                                Browse local files
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={fetchFiles}
                            className="group px-4 py-2.5 bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2 border border-gray-200 dark:border-gray-700"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Breadcrumb & Search */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm overflow-x-auto w-full md:w-auto">
                    <button
                        onClick={goHome}
                        className="p-2 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        <Home className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <div className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
                        {currentPath.split('/').map((part, idx, arr) => (
                            <span key={idx} className="flex items-center">
                                <span className="text-gray-600 dark:text-gray-400">{part}</span>
                                {idx < arr.length - 1 && <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="relative w-full md:w-auto">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search files..."
                        className="w-full md:w-64 pl-10 pr-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-300 dark:border-gray-700 focus:border-green-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* File List */}
            <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
                {currentPath !== '.' && (
                    <button
                        onClick={goBack}
                        className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition border-b border-gray-200 dark:border-gray-700/50"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
                        <span className="text-gray-600 dark:text-gray-400">..</span>
                    </button>
                )}

                {files.length === 0 ? (
                    <div className="text-center py-16 px-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                            <Folder className="w-8 h-8 text-green-400" />
                        </div>
                        <p className="text-gray-900 dark:text-white text-lg font-semibold mb-2">No files found</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
                            This filesystem browses your uploaded study materials stored locally.
                            Files you upload through the "Upload Files" page will appear here.
                        </p>
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg max-w-md mx-auto">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                📁 Location: <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">backend/uploads/user_files</code>
                            </p>
                        </div>
                    </div>
                ) : (

                    <div className="divide-y divide-gray-200 dark:divide-gray-700/50">
                        {files.map((entry, idx) => {
                            const Icon = getFileIcon(entry);
                            return (
                                <div
                                    key={idx}
                                    onClick={() => entry.is_directory && navigateToFolder(entry.name)}
                                    className={`p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${entry.is_directory ? 'cursor-pointer' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${entry.is_directory ? 'bg-yellow-500/20' : 'bg-green-500/20'}`}>
                                            <Icon className={`w-5 h-5 ${entry.is_directory ? 'text-yellow-500' : 'text-green-500'}`} />
                                        </div>
                                        <div>
                                            <p className="text-gray-900 dark:text-white font-medium">{entry.name}</p>
                                            <p className="text-gray-500 text-sm">
                                                {entry.is_directory ? 'Folder' : formatSize(entry.size)}
                                            </p>
                                        </div>
                                    </div>
                                    {entry.is_directory && (
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
