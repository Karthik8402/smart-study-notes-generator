import { useState, useEffect } from 'react';
import { mcpAPI } from '../services/api';
import { HardDrive, Folder, File, FolderPlus, FilePlus, Trash2, Edit3, Search, RefreshCw, ChevronRight, Home, Save } from 'lucide-react';

export default function MCPFilesystem() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPath, setCurrentPath] = useState('.');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFileModal, setShowFileModal] = useState(false);
    const [showDirModal, setShowDirModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState('');

    const [newFile, setNewFile] = useState({ name: '', content: '' });
    const [newDirName, setNewDirName] = useState('');

    useEffect(() => {
        fetchDirectory();
    }, [currentPath]);

    const fetchDirectory = async () => {
        setLoading(true);
        try {
            const data = await mcpAPI.listDirectory(currentPath);
            setItems(data.items || []);
        } catch (error) {
            console.error('Failed to fetch directory:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (itemName, isDir) => {
        if (isDir) {
            const newPath = currentPath === '.' ? itemName : `${currentPath}/${itemName}`;
            setCurrentPath(newPath);
        } else {
            handleViewFile(itemName);
        }
    };

    const handleViewFile = async (filename) => {
        const path = currentPath === '.' ? filename : `${currentPath}/${filename}`;
        try {
            const data = await mcpAPI.readFile(path);
            if (data.error) {
                alert(data.error);
                return;
            }
            setSelectedFile({ name: filename, path });
            setFileContent(data.content || '');
        } catch (error) {
            alert('Failed to read file');
        }
    };

    const handleSaveFile = async () => {
        try {
            await mcpAPI.writeFile(selectedFile.path, fileContent);
            alert('File saved successfully!');
            fetchDirectory();
        } catch (error) {
            alert('Failed to save file');
        }
    };

    const handleCreateFile = async (e) => {
        e.preventDefault();
        const path = currentPath === '.' ? newFile.name : `${currentPath}/${newFile.name}`;
        try {
            await mcpAPI.writeFile(path, newFile.content);
            setShowFileModal(false);
            setNewFile({ name: '', content: '' });
            fetchDirectory();
        } catch (error) {
            alert('Failed to create file');
        }
    };

    const handleCreateDir = async (e) => {
        e.preventDefault();
        const path = currentPath === '.' ? newDirName : `${currentPath}/${newDirName}`;
        try {
            await mcpAPI.createDirectory(path);
            setShowDirModal(false);
            setNewDirName('');
            fetchDirectory();
        } catch (error) {
            alert('Failed to create directory');
        }
    };

    const handleDelete = async (name, isDir) => {
        if (!confirm(`Delete ${isDir ? 'directory' : 'file'} "${name}"?`)) return;
        const path = currentPath === '.' ? name : `${currentPath}/${name}`;
        try {
            await mcpAPI.deleteFile(path);
            fetchDirectory();
        } catch (error) {
            alert('Failed to delete');
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchDirectory();
            return;
        }
        try {
            setLoading(true);
            const data = await mcpAPI.searchFiles(searchQuery, currentPath);
            setItems(data.matches?.map(m => ({
                name: m.name,
                type: 'file',
                size: m.size
            })) || []);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const goUp = () => {
        if (currentPath === '.') return;
        const parts = currentPath.split('/');
        parts.pop();
        setCurrentPath(parts.length === 0 ? '.' : parts.join('/'));
    };

    const goHome = () => setCurrentPath('.');

    const formatSize = (bytes) => {
        if (!bytes) return '-';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const pathParts = currentPath === '.' ? [] : currentPath.split('/');

    if (loading && items.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-500/30 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600/20 via-green-500/10 to-teal-600/20 border border-white/10 backdrop-blur-xl p-6">
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
                            <HardDrive className="w-8 h-8 text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                Filesystem
                            </h1>
                            <p className="text-gray-700 dark:text-gray-600 dark:text-gray-400 mt-1">Browse and manage your files</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowDirModal(true)}
                            className="group px-4 py-2.5 bg-gray-700/50 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-600/50 transition-all flex items-center gap-2 border border-gray-600/50"
                        >
                            <FolderPlus className="w-4 h-4" />
                            New Folder
                        </button>
                        <button
                            onClick={() => setShowFileModal(true)}
                            className="group px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 dark:text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2"
                        >
                            <FilePlus className="w-4 h-4" />
                            New File
                        </button>
                    </div>
                </div>
            </div>

            {/* Breadcrumb & Search */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 px-3 py-2">
                    <button onClick={goHome} className="p-1 hover:bg-gray-700 rounded transition">
                        <Home className="w-4 h-4 text-gray-700 dark:text-gray-600 dark:text-gray-400" />
                    </button>
                    {pathParts.length > 0 && (
                        <>
                            <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-600" />
                            {pathParts.map((part, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPath(pathParts.slice(0, i + 1).join('/'))}
                                        className="text-gray-300 hover:text-gray-900 dark:text-white transition text-sm"
                                    >
                                        {part}
                                    </button>
                                    {i < pathParts.length - 1 && <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-600" />}
                                </div>
                            ))}
                        </>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search files..."
                            className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-700 focus:border-emerald-500 focus:outline-none w-64"
                        />
                    </div>
                    <button
                        onClick={fetchDirectory}
                        className="p-2 text-gray-700 dark:text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-700 rounded-xl transition"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Files & Folders */}
            <div className="bg-gray-100 dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
                {items.length === 0 ? (
                    <div className="text-center py-16">
                        <Folder className="w-16 h-16 text-gray-700 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-700 dark:text-gray-600 dark:text-gray-400 text-lg">This folder is empty</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-700/50">
                        {currentPath !== '.' && (
                            <button
                                onClick={goUp}
                                className="w-full p-4 flex items-center gap-4 hover:bg-gray-700/30 transition text-left"
                            >
                                <div className="p-2 rounded-lg bg-gray-700/50">
                                    <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-600 dark:text-gray-400 rotate-180" />
                                </div>
                                <span className="text-gray-700 dark:text-gray-600 dark:text-gray-400">..</span>
                            </button>
                        )}
                        {items
                            .sort((a, b) => (a.type === 'directory' ? -1 : 1))
                            .map((item, idx) => (
                                <div
                                    key={idx}
                                    className="group p-4 flex items-center justify-between hover:bg-gray-700/30 transition"
                                >
                                    <button
                                        onClick={() => handleNavigate(item.name, item.type === 'directory')}
                                        className="flex items-center gap-4 flex-1 text-left"
                                    >
                                        <div className={`p-2 rounded-lg ${item.type === 'directory' ? 'bg-yellow-500/20' : 'bg-emerald-500/20'}`}>
                                            {item.type === 'directory' ? (
                                                <Folder className="w-5 h-5 text-yellow-400" />
                                            ) : (
                                                <File className="w-5 h-5 text-emerald-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-gray-900 dark:text-white font-medium">{item.name}</p>
                                            <p className="text-gray-500 dark:text-gray-500 text-sm">
                                                {item.type === 'directory' ? 'Folder' : formatSize(item.size)}
                                                {item.modified && ` • ${new Date(item.modified).toLocaleDateString()}`}
                                            </p>
                                        </div>
                                    </button>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                        {item.type !== 'directory' && (
                                            <button
                                                onClick={() => handleViewFile(item.name)}
                                                className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(item.name, item.type === 'directory')}
                                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* File Viewer/Editor Modal */}
            {selectedFile && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-gray-200 dark:border-gray-700/50 shadow-2xl animate-slideUp">
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <File className="w-5 h-5 text-emerald-400" />
                                {selectedFile.name}
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveFile}
                                    className="px-3 py-1.5 bg-emerald-500 text-gray-900 dark:text-white rounded-lg hover:bg-emerald-400 transition flex items-center gap-1.5"
                                >
                                    <Save className="w-4 h-4" />
                                    Save
                                </button>
                                <button
                                    onClick={() => { setSelectedFile(null); setFileContent(''); }}
                                    className="px-3 py-1.5 bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-600 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                        <textarea
                            value={fileContent}
                            onChange={(e) => setFileContent(e.target.value)}
                            className="flex-1 p-4 bg-gray-950 text-gray-200 font-mono text-sm resize-none focus:outline-none"
                            placeholder="File content..."
                        />
                    </div>
                </div>
            )}

            {/* Create File Modal */}
            {showFileModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700/50 shadow-2xl animate-slideUp">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FilePlus className="w-5 h-5 text-emerald-400" />
                            New File
                        </h2>
                        <form onSubmit={handleCreateFile} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm mb-1.5 font-medium">Filename</label>
                                <input
                                    type="text"
                                    value={newFile.name}
                                    onChange={e => setNewFile({ ...newFile, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-700 focus:border-emerald-500 focus:outline-none"
                                    placeholder="example.txt"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm mb-1.5 font-medium">Content</label>
                                <textarea
                                    value={newFile.content}
                                    onChange={e => setNewFile({ ...newFile, content: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-700 focus:border-emerald-500 focus:outline-none resize-none font-mono text-sm"
                                    rows={5}
                                    placeholder="File content..."
                                />
                            </div>
                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowFileModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-600 transition-all font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 dark:text-white rounded-xl hover:shadow-lg transition-all font-medium"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Directory Modal */}
            {showDirModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700/50 shadow-2xl animate-slideUp">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FolderPlus className="w-5 h-5 text-yellow-400" />
                            New Folder
                        </h2>
                        <form onSubmit={handleCreateDir} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm mb-1.5 font-medium">Folder Name</label>
                                <input
                                    type="text"
                                    value={newDirName}
                                    onChange={e => setNewDirName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-700 focus:border-yellow-500 focus:outline-none"
                                    placeholder="My Folder"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDirModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-600 transition-all font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 dark:text-white rounded-xl hover:shadow-lg transition-all font-medium"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}



