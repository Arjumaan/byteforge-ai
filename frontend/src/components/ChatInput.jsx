import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiSquare, FiCpu, FiChevronDown, FiAlertTriangle } from 'react-icons/fi';

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
    <form onSubmit={handleSubmit} className="p-2 border-t border-gray-100 dark:border-night-800 bg-white dark:bg-night-950/95 backdrop-blur-md relative z-20 transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-1.5">
        {/* Model Selector Pill */}
        <div className="relative inline-block" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white dark:bg-night-900 border border-gray-100 dark:border-night-800 text-[10px] font-bold text-primary-600 dark:text-primary-400 hover:border-primary-400 transition-all shadow-sm"
          >
            <FiCpu className="w-2.5 h-2.5" />
            <span>{selectedModel?.name || 'Select Model'}</span>
            <FiChevronDown className={`w-2.5 h-2.5 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
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
                  <span className="flex-1 truncate">{model.name}</span>
                  {model.warning && <FiAlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-end gap-2 bg-white dark:bg-night-900 rounded-lg border border-gray-100 dark:border-night-800 p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary-500/10 transition-all duration-300">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message...`}
            disabled={disabled || isLoading}
            rows={1}
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none focus:outline-none min-h-[18px] max-h-[120px] text-xs leading-tight font-medium"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!message.trim() || disabled || isLoading}
            className={`p-1.5 rounded-md transition-all duration-200 flex items-center justify-center ${message.trim() && !disabled && !isLoading
              ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-500 active:scale-95'
              : 'bg-gray-100 dark:bg-night-800 text-gray-400 cursor-not-allowed'
              }`}
          >
            {isLoading ? (
              <FiSquare className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <FiSend className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        <p className="text-[9px] text-gray-400 dark:text-gray-500 text-center font-medium opacity-60">
          ByteForge AI can make mistakes.
        </p>
      </div>
    </form>
  );
};

export default ChatInput;