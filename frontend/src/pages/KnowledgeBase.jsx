import React, { useState, useEffect } from 'react';
import { FiUpload, FiTrash2, FiFile, FiCheck, FiLoader, FiAlertTriangle, FiSearch, FiDatabase } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import api from '../services/api';
import toast from 'react-hot-toast';

const KnowledgeBase = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await api.get('/knowledge/documents/');
            setDocuments(response.data.documents || []);
        } catch (error) {
            toast.error('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (files) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        let successCount = 0;

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

            try {
                await api.post('/knowledge/documents/upload/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                successCount++;
            } catch (error) {
                toast.error(`Failed to upload: ${file.name}`);
            }
        }

        if (successCount > 0) {
            toast.success(`${successCount} file(s) uploaded!`);
            fetchDocuments();
        }
        setUploading(false);
    };

    const handleDelete = async (docId) => {
        if (!window.confirm('Delete this document and remove it from AI context?')) return;
        try {
            await api.delete(`/knowledge/documents/${docId}/`);
            toast.success('Document deleted');
            setDocuments((prev) => prev.filter((d) => d.id !== docId));
        } catch (error) {
            toast.error('Failed to delete document');
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.length) {
            handleUpload(e.dataTransfer.files);
        }
    };

    const statusIcon = (status) => {
        if (status === 'ready') return <FiCheck className="w-3.5 h-3.5 text-green-500" />;
        if (status === 'processing') return <FiLoader className="w-3.5 h-3.5 text-yellow-500 animate-spin" />;
        return <FiAlertTriangle className="w-3.5 h-3.5 text-red-500" />;
    };

    const filteredDocs = documents.filter((d) =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-screen flex flex-col bg-white dark:bg-night-950 font-sans text-dark-900 dark:text-gray-100 transition-colors">
            <Navbar />
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl text-white shadow-lg shadow-primary-500/25">
                            <FiDatabase className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight">
                                Knowledge <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Base</span>
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Upload documents for AI-powered context in your chats.
                            </p>
                        </div>
                    </div>

                    {/* Upload Zone */}
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 mb-6 ${dragActive
                                ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-500/10 scale-[1.02]'
                                : 'border-gray-200 dark:border-night-800 hover:border-primary-400 bg-gray-50/50 dark:bg-night-900/50'
                            }`}
                    >
                        <FiUpload className={`w-8 h-8 mx-auto mb-3 transition-colors ${dragActive ? 'text-primary-500' : 'text-gray-400'}`} />
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            {uploading ? 'Uploading...' : 'Drag & drop files here'}
                        </p>
                        <p className="text-xs text-gray-400 mb-3">PDF, TXT, Markdown, CSV — Max 10MB</p>
                        <label className="inline-block cursor-pointer">
                            <span className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                                Browse Files
                            </span>
                            <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.txt,.md,.csv"
                                multiple
                                onChange={(e) => handleUpload(e.target.files)}
                                disabled={uploading}
                            />
                        </label>
                    </div>

                    {/* Search */}
                    {documents.length > 0 && (
                        <div className="relative mb-4">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search documents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-night-900 border border-gray-200 dark:border-night-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            />
                        </div>
                    )}

                    {/* Documents Grid */}
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-primary-100 dark:border-night-700 border-t-primary-500 rounded-full animate-spin" />
                        </div>
                    ) : filteredDocs.length === 0 ? (
                        <div className="text-center py-12">
                            <FiFile className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-sm text-gray-400">
                                {documents.length === 0 ? 'No documents uploaded yet.' : 'No matching documents.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {filteredDocs.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="group bg-white dark:bg-night-900 border border-gray-100 dark:border-night-800 rounded-xl p-4 flex items-start gap-3 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="p-2 bg-primary-50 dark:bg-primary-500/10 rounded-lg flex-shrink-0">
                                        <FiFile className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{doc.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {statusIcon(doc.status)}
                                            <span className="text-[10px] text-gray-400 uppercase font-bold">{doc.file_type}</span>
                                            <span className="text-[10px] text-gray-400">{doc.file_size_display}</span>
                                            {doc.chunk_count > 0 && (
                                                <span className="text-[10px] text-gray-400">{doc.chunk_count} chunks</span>
                                            )}
                                        </div>
                                        {doc.error_message && (
                                            <p className="text-[10px] text-red-500 mt-1 truncate">{doc.error_message}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                    >
                                        <FiTrash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KnowledgeBase;
