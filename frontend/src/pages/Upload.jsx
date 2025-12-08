import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadAPI } from '../services/api';
import {
    Upload as UploadIcon,
    FileText,
    Image,
    Youtube,
    File,
    X,
    Check,
    Loader2,
    Trash2,
    AlertCircle
} from 'lucide-react';

const fileTypeIcons = {
    pdf: FileText,
    pptx: File,
    ppt: File,
    png: Image,
    jpg: Image,
    jpeg: Image,
    youtube: Youtube,
    text: FileText,
};

export default function Upload() {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState({});
    const [documents, setDocuments] = useState([]);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [youtubeTitle, setYoutubeTitle] = useState('');
    const [textContent, setTextContent] = useState('');
    const [textTitle, setTextTitle] = useState('');
    const [activeTab, setActiveTab] = useState('file');

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const docs = await uploadAPI.getDocuments();
            setDocuments(docs);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    const onDrop = useCallback((acceptedFiles) => {
        const newFiles = acceptedFiles.map(file => ({
            file,
            id: Math.random().toString(36).substr(2, 9),
            status: 'pending',
            progress: 0
        }));
        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
            'application/vnd.ms-powerpoint': ['.ppt'],
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'text/plain': ['.txt'],
        },
        maxSize: 50 * 1024 * 1024, // 50MB
    });

    const uploadFile = async (fileData) => {
        setUploading(prev => ({ ...prev, [fileData.id]: true }));

        try {
            setFiles(prev => prev.map(f =>
                f.id === fileData.id ? { ...f, status: 'uploading' } : f
            ));

            await uploadAPI.uploadFile(fileData.file, (progress) => {
                setFiles(prev => prev.map(f =>
                    f.id === fileData.id ? { ...f, progress } : f
                ));
            });

            setFiles(prev => prev.map(f =>
                f.id === fileData.id ? { ...f, status: 'success' } : f
            ));

            fetchDocuments();
        } catch (error) {
            console.error('Upload error:', error);
            setFiles(prev => prev.map(f =>
                f.id === fileData.id ? { ...f, status: 'error', error: error.message } : f
            ));
        } finally {
            setUploading(prev => ({ ...prev, [fileData.id]: false }));
        }
    };

    const uploadAll = async () => {
        const pendingFiles = files.filter(f => f.status === 'pending');
        for (const file of pendingFiles) {
            await uploadFile(file);
        }
    };

    const removeFile = (id) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleYoutubeUpload = async () => {
        if (!youtubeUrl.trim()) return;

        setUploading(prev => ({ ...prev, youtube: true }));

        try {
            await uploadAPI.uploadYouTube(youtubeUrl, youtubeTitle || null);
            setYoutubeUrl('');
            setYoutubeTitle('');
            fetchDocuments();
            alert('YouTube transcript extracted successfully!');
        } catch (error) {
            alert('Failed to extract YouTube transcript: ' + (error.response?.data?.detail || error.message));
        } finally {
            setUploading(prev => ({ ...prev, youtube: false }));
        }
    };

    const handleTextUpload = async () => {
        if (!textContent.trim() || !textTitle.trim()) return;

        setUploading(prev => ({ ...prev, text: true }));

        try {
            await uploadAPI.uploadText(textContent, textTitle);
            setTextContent('');
            setTextTitle('');
            fetchDocuments();
            alert('Text content uploaded successfully!');
        } catch (error) {
            alert('Failed to upload text: ' + (error.response?.data?.detail || error.message));
        } finally {
            setUploading(prev => ({ ...prev, text: false }));
        }
    };

    const deleteDocument = async (docId) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            await uploadAPI.deleteDocument(docId);
            setDocuments(documents.filter(d => d.id !== docId));
        } catch (error) {
            alert('Failed to delete document');
        }
    };

    const getFileIcon = (type) => {
        const Icon = fileTypeIcons[type] || File;
        return Icon;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                    <UploadIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        Upload Study Materials
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Add your PDFs, PowerPoints, images, or YouTube links
                    </p>
                </div>
            </div>

            {/* Upload Tabs */}
            <div className="card">
                <div className="flex gap-2 mb-6">
                    {[
                        { id: 'file', label: 'File Upload', icon: FileText },
                        { id: 'youtube', label: 'YouTube', icon: Youtube },
                        { id: 'text', label: 'Text', icon: FileText },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'file' && (
                    <div className="space-y-4">
                        {/* Dropzone */}
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-gray-300 dark:border-gray-700 hover:border-primary-400'
                                }`}
                        >
                            <input {...getInputProps()} />
                            <UploadIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            {isDragActive ? (
                                <p className="text-primary-600 dark:text-primary-400 font-medium">
                                    Drop the files here...
                                </p>
                            ) : (
                                <>
                                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                                        Drag & drop files here, or click to select
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        Supports PDF, PPT, PPTX, PNG, JPG, TXT (max 50MB)
                                    </p>
                                </>
                            )}
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="space-y-2">
                                {files.map((fileData) => {
                                    const ext = fileData.file.name.split('.').pop().toLowerCase();
                                    const Icon = getFileIcon(ext);

                                    return (
                                        <div
                                            key={fileData.id}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800"
                                        >
                                            <Icon className="w-5 h-5 text-gray-500" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                                    {fileData.file.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>

                                            {fileData.status === 'uploading' && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary-500 transition-all"
                                                            style={{ width: `${fileData.progress}%` }}
                                                        />
                                                    </div>
                                                    <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                                                </div>
                                            )}

                                            {fileData.status === 'success' && (
                                                <Check className="w-5 h-5 text-green-500" />
                                            )}

                                            {fileData.status === 'error' && (
                                                <AlertCircle className="w-5 h-5 text-red-500" />
                                            )}

                                            {fileData.status === 'pending' && (
                                                <button
                                                    onClick={() => removeFile(fileData.id)}
                                                    className="p-1 text-gray-400 hover:text-red-500"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}

                                {files.some(f => f.status === 'pending') && (
                                    <button
                                        onClick={uploadAll}
                                        className="btn-primary w-full flex items-center justify-center gap-2"
                                    >
                                        <UploadIcon className="w-5 h-5" />
                                        Upload All Files
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'youtube' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                YouTube URL
                            </label>
                            <input
                                type="text"
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Title (optional)
                            </label>
                            <input
                                type="text"
                                value={youtubeTitle}
                                onChange={(e) => setYoutubeTitle(e.target.value)}
                                placeholder="Enter a title for this video"
                                className="input-field"
                            />
                        </div>
                        <button
                            onClick={handleYoutubeUpload}
                            disabled={!youtubeUrl.trim() || uploading.youtube}
                            className="btn-primary flex items-center justify-center gap-2"
                        >
                            {uploading.youtube ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Extracting transcript...
                                </>
                            ) : (
                                <>
                                    <Youtube className="w-5 h-5" />
                                    Extract Transcript
                                </>
                            )}
                        </button>
                    </div>
                )}

                {activeTab === 'text' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Title
                            </label>
                            <input
                                type="text"
                                value={textTitle}
                                onChange={(e) => setTextTitle(e.target.value)}
                                placeholder="Enter a title for this content"
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Content
                            </label>
                            <textarea
                                value={textContent}
                                onChange={(e) => setTextContent(e.target.value)}
                                placeholder="Paste your study notes or content here..."
                                rows={8}
                                className="input-field resize-none"
                            />
                        </div>
                        <button
                            onClick={handleTextUpload}
                            disabled={!textContent.trim() || !textTitle.trim() || uploading.text}
                            className="btn-primary flex items-center justify-center gap-2"
                        >
                            {uploading.text ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <UploadIcon className="w-5 h-5" />
                                    Upload Text
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Uploaded Documents */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Uploaded Documents ({documents.length})
                </h2>

                {documents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.map((doc) => {
                            const Icon = getFileIcon(doc.file_type);

                            return (
                                <div key={doc.id} className="card">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                                            <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                                {doc.filename}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {doc.file_type.toUpperCase()} • {doc.chunks_count} chunks
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(doc.uploaded_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => deleteDocument(doc.id)}
                                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="card p-8 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            No documents uploaded yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Upload your study materials to get started
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
