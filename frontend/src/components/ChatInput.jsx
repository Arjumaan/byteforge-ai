import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiSquare, FiCpu, FiChevronDown } from 'react-icons/fi';

const ChatInput = ({ onSend, disabled, isLoading, models, selectedModel, onModelChange }) => {
  const [message, setMessage] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isLoading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 border-t border-gray-100 dark:border-night-800 bg-white dark:bg-night-950/95 backdrop-blur-md relative z-20 transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Model Selector Pill */}
        <div className="relative inline-block" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-night-900 border border-gray-100 dark:border-night-800 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-night-800 transition-all shadow-sm group"
          >
            <div className="p-1 bg-primary-100 dark:bg-primary-500/20 rounded-full group-hover:bg-primary-200 dark:group-hover:bg-primary-500/30 transition-colors">
              <FiCpu className="w-3 h-3 text-primary-600 dark:text-primary-400" />
            </div>
            <span>{selectedModel?.name || 'Select Model'}</span>
            <FiChevronDown className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showModelDropdown && (
            <div className="absolute bottom-full left-0 mb-2 w-64 max-h-72 overflow-y-auto bg-white dark:bg-night-900 border border-gray-100 dark:border-night-800 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-none p-2 z-30 ring-1 ring-black/5 dark:ring-white/5">
              <div className="px-3 py-2 text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Available Models</div>
              {models.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onModelChange(model);
                    setShowModelDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center gap-3 transition-colors ${selectedModel?.id === model.id ? 'bg-primary-50 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-night-800'
                    }`}
                >
                  <div className={`w-2 h-2 rounded-full ring-2 ring-offset-1 ${selectedModel?.id === model.id ? 'bg-primary-500 ring-primary-200 dark:ring-primary-500/30' : 'bg-gray-300 dark:bg-gray-600 ring-transparent'}`} />
                  {model.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-end gap-3 bg-white dark:bg-night-900 rounded-2xl border border-gray-100 dark:border-night-800 p-4 shadow-sm focus-within:shadow-md focus-within:border-primary-400 dark:focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-50 dark:focus-within:ring-primary-500/10 transition-all duration-300">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${selectedModel?.name || 'ByteForge AI'}...`}
            disabled={disabled || isLoading}
            rows={1}
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none min-h-[24px] max-h-[200px] text-sm leading-relaxed font-medium"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!message.trim() || disabled || isLoading}
            className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${message.trim() && !disabled && !isLoading
              ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 hover:scale-105 active:scale-95'
              : 'bg-gray-100 dark:bg-night-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
          >
            {isLoading ? (
              <FiSquare className="w-5 h-5 animate-pulse" />
            ) : (
              <FiSend className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center font-medium opacity-70">
          ByteForge AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </form>
  );
};

export default ChatInput;