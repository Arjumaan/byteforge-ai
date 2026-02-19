import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiCode, FiEdit3, FiBarChart2, FiTool, FiZap, FiHash } from 'react-icons/fi';
import api from '../services/api';

const CATEGORY_ICONS = {
    coding: <FiCode className="w-3 h-3" />,
    writing: <FiEdit3 className="w-3 h-3" />,
    analysis: <FiBarChart2 className="w-3 h-3" />,
    debug: <FiTool className="w-3 h-3" />,
    general: <FiZap className="w-3 h-3" />,
    custom: <FiHash className="w-3 h-3" />,
};

const CATEGORY_COLORS = {
    coding: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
    writing: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10',
    analysis: 'text-green-500 bg-green-50 dark:bg-green-500/10',
    debug: 'text-red-500 bg-red-50 dark:bg-red-500/10',
    general: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10',
    custom: 'text-gray-500 bg-gray-50 dark:bg-gray-500/10',
};

const PromptLibraryModal = ({ isOpen, onClose, onSelectPrompt }) => {
    const [prompts, setPrompts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const searchRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchPrompts();
            setTimeout(() => searchRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const fetchPrompts = async () => {
        try {
            const response = await api.get('/prompts/');
            setPrompts(response.data.prompts || []);
        } catch (error) {
            console.error('Failed to load prompts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (prompt) => {
        // Track usage
        try {
            await api.post(`/prompts/${prompt.id}/use/`);
        } catch (e) {
            // Non-critical
        }
        onSelectPrompt(prompt.content);
        onClose();
    };

    const categories = ['all', ...new Set(prompts.map((p) => p.category))];

    const filtered = prompts.filter((p) => {
        const matchesSearch =
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-night-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col border border-gray-200 dark:border-night-800 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-night-800">
                    <div>
                        <h2 className="text-base font-extrabold tracking-tight">
                            Prompt <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Forge</span>
                        </h2>
                        <p className="text-[10px] text-gray-400 mt-0.5">Select a prompt template to inject into your message.</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-night-800 rounded-lg transition-colors">
                        <FiX className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-5 py-3 border-b border-gray-100 dark:border-night-800">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Search prompts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-night-800 border-none rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                    </div>

                    {/* Category Tabs */}
                    <div className="flex gap-1.5 mt-2.5 overflow-x-auto scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize whitespace-nowrap transition-all ${activeCategory === cat
                                        ? 'bg-primary-600 text-white shadow-sm'
                                        : 'bg-gray-100 dark:bg-night-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-night-700'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Prompt List */}
                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <p className="text-center text-xs text-gray-400 py-8">No prompts found.</p>
                    ) : (
                        filtered.map((prompt) => (
                            <button
                                key={prompt.id}
                                onClick={() => handleSelect(prompt)}
                                className="w-full text-left p-3 rounded-xl border border-gray-100 dark:border-night-800 hover:border-primary-300 dark:hover:border-primary-500/30 hover:shadow-sm bg-white dark:bg-night-900 transition-all group"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`p-1 rounded ${CATEGORY_COLORS[prompt.category] || CATEGORY_COLORS.general}`}>
                                        {CATEGORY_ICONS[prompt.category] || CATEGORY_ICONS.general}
                                    </span>
                                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-primary-600 transition-colors">
                                        {prompt.title}
                                    </span>
                                    {prompt.is_system && (
                                        <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 text-[8px] font-bold rounded-full uppercase">
                                            System
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">{prompt.description}</p>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default PromptLibraryModal;
