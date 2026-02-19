import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const SlashCommandMenu = ({ isOpen, query, onSelect, onClose, position }) => {
    const [prompts, setPrompts] = useState([]);
    const [filteredPrompts, setFilteredPrompts] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchPrompts();
        }
    }, [isOpen]);

    useEffect(() => {
        if (query) {
            const filtered = prompts.filter(
                (p) =>
                    p.title.toLowerCase().includes(query.toLowerCase()) ||
                    p.slug.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredPrompts(filtered.slice(0, 6));
        } else {
            setFilteredPrompts(prompts.slice(0, 6));
        }
        setSelectedIndex(0);
    }, [query, prompts]);

    const fetchPrompts = async () => {
        try {
            const response = await api.get('/prompts/');
            setPrompts(response.data.prompts || []);
        } catch (error) {
            console.error('Failed to load prompts:', error);
        }
    };

    const handleKeyDown = (e) => {
        if (!isOpen) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, filteredPrompts.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            if (filteredPrompts[selectedIndex]) {
                onSelect(filteredPrompts[selectedIndex].content);
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, selectedIndex, filteredPrompts]);

    if (!isOpen || filteredPrompts.length === 0) return null;

    return (
        <div
            ref={menuRef}
            className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-night-900 border border-gray-200 dark:border-night-800 rounded-xl shadow-xl z-50 overflow-hidden"
            style={position ? { left: position.left, bottom: position.bottom } : {}}
        >
            <div className="px-3 py-2 text-[9px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider border-b border-gray-100 dark:border-night-800">
                Slash Commands
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
                {filteredPrompts.map((prompt, index) => (
                    <button
                        key={prompt.id}
                        onClick={() => onSelect(prompt.content)}
                        className={`w-full text-left px-3 py-2 transition-colors ${index === selectedIndex
                                ? 'bg-primary-50 dark:bg-primary-500/10'
                                : 'hover:bg-gray-50 dark:hover:bg-night-800'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-primary-500 text-xs font-mono font-bold">/{prompt.slug}</span>
                            <span className="text-[10px] text-gray-500 truncate">{prompt.title}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{prompt.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SlashCommandMenu;
