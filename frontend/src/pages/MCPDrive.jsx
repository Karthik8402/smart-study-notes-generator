import { useState, useEffect } from 'react';
import { mcpAPI, googleAPI } from '../services/api';
import { FolderOpen, Upload, Trash2, Download, Search, Plus, Grid, List, FileText, Image, File, ChevronRight, Check } from 'lucide-react';

export default function MCPDrive() {
    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [stats, setStats] = useState(null);

    // Google integration state
    const [useGoogle, setUseGoogle] = useState(false);
    const [googleConnected, setGoogleConnected] = useState(false);
    const [googleConnecting, setGoogleConnecting] = useState(false);

    const [uploadData, setUploadData] = useState({
        filename: '',
        content: '',
        folder: 'Documents',
        description: ''
    });

    const [newFolderName, setNewFolderName] = useState('');

    useEffect(() => {
        fetchData();
        if (useGoogle) {
            checkGoogleConnection();
        }
    }, [currentFolder, useGoogle]);

    const checkGoogleConnection = async () => {
        try {
            const status = await googleAPI.driveStatus();
            setGoogleConnected(status.authenticated === true);
        } catch (error) {
            setGoogleConnected(false);
        }
    };

    const connectGoogle = async () => {
        setGoogleConnecting(true);
        try {
            const result = await googleAPI.driveAuth();
            if (result.success) {
                setGoogleConnected(true);
                fetchData();
            } else {
                alert(result.error || 'Failed to connect Google Drive');
            }
        } catch (error) {
            alert('Failed to connect: ' + error.message);
        } finally {
            setGoogleConnecting(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (useGoogle) {
                const [filesRes, foldersRes, statsRes] = await Promise.all([
                    googleAPI.getGoogleDriveFiles(currentFolder),
                    googleAPI.getGoogleDriveFolders(),
                    googleAPI.getGoogleDriveStats()
                ]);
                setFiles(filesRes.files || []);
                setFolders(foldersRes.folders || []);
                setStats(statsRes);
            } else {
                const [filesRes, foldersRes, statsRes] = await Promise.all([
                    mcpAPI.getDriveFiles(currentFolder),
                    mcpAPI.getDriveFolders(),
                    mcpAPI.getDriveStats()
                ]);
                setFiles(filesRes.files || []);
                setFolders(foldersRes.folders || []);
                setStats(statsRes);
            }
        } catch (error) {
            console.error('Failed to fetch drive data:', error);
            if (useGoogle && error.response?.data?.need_auth) {
                setGoogleConnected(false);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        try {
            if (useGoogle) {
                await googleAPI.uploadToGoogleDrive(
                    uploadData.filename,
                    uploadData.content,
                    uploadData.folder || currentFolder || null,
                    uploadData.description
                );
            } else {
                await mcpAPI.uploadToDrive(
                    uploadData.filename,
                    uploadData.content,
                    uploadData.folder || currentFolder || 'Documents',
                    uploadData.description
                );
            }
            setShowUploadModal(false);
            setUploadData({ filename: '', content: '', folder: 'Documents', description: '' });
            fetchData();
        } catch (error) {
            alert('Failed to upload file');
        }
    };

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        try {
            if (useGoogle) {
                await googleAPI.createGoogleFolder(newFolderName, currentFolder);
            } else {
                await mcpAPI.createFolder(newFolderName, currentFolder);
            }
            setShowFolderModal(false);
            setNewFolderName('');
            fetchData();
        } catch (error) {
            alert('Failed to create folder');
        }
    };

    const handleDelete = async (fileId) => {
        if (!confirm('Delete this file?')) return;
        try {
            if (useGoogle) {
                await googleAPI.deleteGoogleDriveFile(fileId);
            } else {
                await mcpAPI.deleteDriveFile(fileId);
            }
            fetchData();
        } catch (error) {
            alert('Failed to delete file');
        }
    };

    const handleDownload = async (fileId, filename) => {
        try {
            const data = useGoogle
                ? await googleAPI.downloadFromGoogleDrive(fileId)
                : await mcpAPI.downloadFromDrive(fileId);
            const content = data.is_base64 ? atob(data.content) : data.content;
            const blob = new Blob([content], { type: data.mime_type || 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            alert('Failed to download file');
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchData();
            return;
        }
        try {
            setLoading(true);
            const data = useGoogle
                ? await googleAPI.searchGoogleDrive(searchQuery)
                : await mcpAPI.searchDrive(searchQuery);
            setFiles(data.results || []);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFileIcon = (mimeType) => {
        if (!mimeType) return File;
        if (mimeType.startsWith('image/')) return Image;
        if (mimeType.includes('text') || mimeType.includes('markdown')) return FileText;
        return File;
    };

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    if (loading && files.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 via-cyan-500/10 to-teal-600/20 border border-white/10 backdrop-blur-xl p-6">
                <div className="absolute inset-0 bg-grid-white/5"></div>
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
                            <FolderOpen className="w-8 h-8 text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                Drive
                            </h1>
                            <p className="text-gray-700 dark:text-gray-600 dark:text-gray-400 mt-1">
                                {useGoogle ? 'Connected to Google Drive' : 'Local Storage'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Google Toggle */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50">
                            <span className="text-sm text-gray-700 dark:text-gray-600 dark:text-gray-400">Use Google</span>
                            <button
                                onClick={() => setUseGoogle(!useGoogle)}
                                className={`relative w-12 h-6 rounded-full transition-all ${useGoogle ? 'bg-gradient-to-r from-blue-500 to-green-500' : 'bg-gray-600'
                                    }`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${useGoogle ? 'left-7' : 'left-1'
                                    }`}></div>
                            </button>
                            {useGoogle && (
                                googleConnected ? (
                                    <span className="flex items-center gap-1 text-xs text-green-400">
                                        <Check className="w-3 h-3" /> Connected
                                    </span>
                                ) : (
                                    <button
                                        onClick={connectGoogle}
                                        disabled={googleConnecting}
                                        className="px-2 py-1 text-xs bg-blue-500 text-gray-900 dark:text-white rounded hover:bg-blue-600 transition disabled:opacity-50"
                                    >
                                        {googleConnecting ? 'Connecting...' : 'Connect'}
                                    </button>
                                )
                            )}
                        </div>
                        <button
                            onClick={() => setShowFolderModal(true)}
                            className="group px-4 py-2.5 bg-gray-700/50 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-all flex items-center gap-2 border border-gray-600/50"
                        >
                            <Plus className="w-4 h-4" />
                            New Folder
                        </button>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="group px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-gray-900 dark:text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            Upload
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats & Search */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex gap-4">
                    {stats && (
                        <>
                            <div className="px-4 py-2 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50">
                                <span className="text-gray-700 dark:text-gray-600 dark:text-gray-400">Files: </span>
                                <span className="text-gray-900 dark:text-white font-semibold">{stats.total_files || 0}</span>
                            </div>
                            <div className="px-4 py-2 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50">
                                <span className="text-gray-700 dark:text-gray-600 dark:text-gray-400">Size: </span>
                                <span className="text-gray-900 dark:text-white font-semibold">{stats.total_size_formatted || '0 B'}</span>
                            </div>
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
                            className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none w-64"
                        />
                    </div>
                    <div className="flex p-1 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-blue-500 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white'}`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-blue-500 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Folders */}
            {folders.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-600 dark:text-gray-400 uppercase tracking-wider">Folders</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {folders.map((folder, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentFolder(folder.name)}
                                className={`group p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${currentFolder === folder.name
                                    ? 'bg-blue-500/20 border-blue-500/50'
                                    : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50 hover:border-blue-500/30'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <FolderOpen className={`w-8 h-8 ${currentFolder === folder.name ? 'text-blue-400' : 'text-yellow-400'}`} />
                                    <div>
                                        <p className="text-gray-900 dark:text-white font-medium">{folder.name}</p>
                                        <p className="text-gray-500 dark:text-gray-500 text-xs">{folder.file_count || 0} files</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                        {currentFolder && (
                            <button
                                onClick={() => setCurrentFolder(null)}
                                className="p-4 rounded-xl border border-dashed border-gray-700 text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:text-white hover:border-gray-600 transition-all flex items-center justify-center gap-2"
                            >
                                <ChevronRight className="w-4 h-4 rotate-180" />
                                Back to All
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Files */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {currentFolder ? `Files in ${currentFolder}` : 'All Files'}
                </h3>

                {files.length === 0 ? (
                    <div className="text-center py-16 bg-gray-100 dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700/50 border-dashed">
                        <FolderOpen className="w-16 h-16 text-gray-700 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-700 dark:text-gray-600 dark:text-gray-400 text-lg">No files yet</p>
                        <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Upload files to get started</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-4 gap-4">
                        {files.map(file => {
                            const FileIcon = getFileIcon(file.mime_type);
                            return (
                                <div
                                    key={file.id}
                                    className="group p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/5"
                                >
                                    <div className="flex flex-col items-center text-center">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 mb-3">
                                            <FileIcon className="w-8 h-8 text-blue-400" />
                                        </div>
                                        <p className="text-gray-900 dark:text-white font-medium text-sm truncate w-full">{file.filename}</p>
                                        <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">{formatSize(file.size)}</p>
                                        <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDownload(file.id, file.filename)}
                                                className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(file.id)}
                                                className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {files.map(file => {
                            const FileIcon = getFileIcon(file.mime_type);
                            return (
                                <div
                                    key={file.id}
                                    className="group p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 hover:border-blue-500/50 transition-all flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-blue-500/20">
                                            <FileIcon className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-gray-900 dark:text-white font-medium">{file.filename}</p>
                                            <p className="text-gray-500 dark:text-gray-500 text-sm">
                                                {formatSize(file.size)} • {file.folder}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleDownload(file.id, file.filename)}
                                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(file.id)}
                                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700/50 shadow-2xl animate-slideUp">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-blue-400" />
                            Upload File
                        </h2>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm mb-1.5 font-medium">Filename</label>
                                <input
                                    type="text"
                                    value={uploadData.filename}
                                    onChange={e => setUploadData({ ...uploadData, filename: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none"
                                    placeholder="example.txt"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm mb-1.5 font-medium">Content</label>
                                <textarea
                                    value={uploadData.content}
                                    onChange={e => setUploadData({ ...uploadData, content: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                                    rows={5}
                                    placeholder="File content..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm mb-1.5 font-medium">Folder</label>
                                <select
                                    value={uploadData.folder}
                                    onChange={e => setUploadData({ ...uploadData, folder: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="Documents">Documents</option>
                                    <option value="Notes">Notes</option>
                                    <option value="PDFs">PDFs</option>
                                    <option value="Shared">Shared</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-600 transition-all font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-gray-900 dark:text-white rounded-xl hover:shadow-lg transition-all font-medium"
                                >
                                    Upload
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Folder Modal */}
            {showFolderModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700/50 shadow-2xl animate-slideUp">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-yellow-400" />
                            New Folder
                        </h2>
                        <form onSubmit={handleCreateFolder} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm mb-1.5 font-medium">Folder Name</label>
                                <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={e => setNewFolderName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none"
                                    placeholder="My Folder"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowFolderModal(false)}
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



