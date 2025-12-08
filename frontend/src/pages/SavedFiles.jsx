import { useState, useEffect } from 'react';
import { mcpAPI } from '../services/api';

export default function SavedFiles() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
    const [previewContent, setPreviewContent] = useState('');

    const categories = [
        { id: null, name: 'All Files', icon: '📁' },
        { id: 'summaries', name: 'Summaries', icon: '📝' },
        { id: 'mcqs', name: 'MCQs', icon: '❓' },
        { id: 'explanations', name: 'Explanations', icon: '💡' },
        { id: 'topics', name: 'Topics', icon: '📚' },
        { id: 'other', name: 'Other', icon: '📄' },
    ];

    useEffect(() => {
        fetchFiles();
    }, [selectedCategory]);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const data = await mcpAPI.getSavedFiles(selectedCategory);
            setFiles(data);
        } catch (error) {
            console.error('Failed to fetch files:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async (category, filename) => {
        try {
            const data = await mcpAPI.getSavedFileContent(category, filename);
            setPreviewFile({ category, filename });
            setPreviewContent(data.content);
        } catch (error) {
            alert('Failed to load file content');
        }
    };

    const handleDownload = (content, filename) => {
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDelete = async (category, filename) => {
        if (!confirm(`Delete ${filename}?`)) return;
        try {
            await mcpAPI.deleteSavedFile(category, filename);
            fetchFiles();
            if (previewFile?.filename === filename) {
                setPreviewFile(null);
                setPreviewContent('');
            }
        } catch (error) {
            alert('Failed to delete file');
        }
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCategoryIcon = (cat) => {
        const found = categories.find(c => c.id === cat);
        return found?.icon || '📄';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">📁 Saved Files</h1>
                <p className="text-gray-400 mt-1">Browse and manage your saved study notes</p>
            </div>

            <div className="flex gap-6">
                {/* Sidebar - Categories */}
                <div className="w-48 flex-shrink-0">
                    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-3">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Categories</h3>
                        <div className="space-y-1">
                            {categories.map(cat => (
                                <button
                                    key={cat.id || 'all'}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center gap-2 ${selectedCategory === cat.id
                                            ? 'bg-purple-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-700/50'
                                        }`}
                                >
                                    <span>{cat.icon}</span>
                                    <span className="text-sm">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
                            <p className="text-gray-400 text-lg">No files found</p>
                            <p className="text-gray-500 text-sm mt-2">
                                Generate notes from the Notes page to save files here
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {files.map((file, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-purple-500/50 transition"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{getCategoryIcon(file.category)}</span>
                                            <div>
                                                <h3 className="text-white font-medium">{file.filename}</h3>
                                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                                    <span className="capitalize">{file.category}</span>
                                                    <span>•</span>
                                                    <span>{formatSize(file.size)}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(file.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handlePreview(file.category, file.filename)}
                                                className="px-3 py-1.5 text-sm bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition"
                                            >
                                                👁️ Preview
                                            </button>
                                            <button
                                                onClick={() => handleDelete(file.category, file.filename)}
                                                className="px-3 py-1.5 text-sm bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col border border-gray-700">
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h3 className="text-lg font-semibold text-white">{previewFile.filename}</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDownload(previewContent, previewFile.filename)}
                                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-500 transition"
                                >
                                    ⬇️ Download
                                </button>
                                <button
                                    onClick={() => { setPreviewFile(null); setPreviewContent(''); }}
                                    className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
                                >
                                    ✕ Close
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm">
                                {previewContent}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
