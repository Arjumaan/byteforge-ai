import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiSquare, FiCpu, FiChevronDown, FiUser, FiMic, FiMicOff, FiBookOpen, FiSearch, FiStar, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import SlashCommandMenu from './SlashCommandMenu';

const PROVIDER_COLORS = {
  openai: 'bg-green-500',
  anthropic: 'bg-orange-500',
  google: 'bg-blue-500',
  meta: 'bg-indigo-500',
  mistral: 'bg-cyan-500',
  deepseek: 'bg-purple-500',
  cohere: 'bg-pink-500',
  qwen: 'bg-amber-500',
  other: 'bg-gray-500',
};

const PROVIDER_LABELS = {
  all: 'All',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  meta: 'Meta',
  mistral: 'Mistral',
  deepseek: 'DeepSeek',
  cohere: 'Cohere',
  qwen: 'Qwen',
  other: 'Other',
};

const ChatInput = ({ onSend, disabled, isLoading, models, selectedModel, onModelChange, onOpenPromptLibrary }) => {
  const [message, setMessage] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState({ id: 'general', name: 'General Assistant', icon: <FiUser /> });
  const [isListening, setIsListening] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [activeProvider, setActiveProvider] = useState('all');
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const personaDropdownRef = useRef(null);
  const modelSearchRef = useRef(null);

  const personas = [
    { id: 'general', name: 'General Assistant', icon: <FiUser className="w-3 h-3" /> },
    { id: 'developer', name: 'Developer Mode', icon: <FiCpu className="w-3 h-3" /> },
    { id: 'creative', name: 'Creative Writer', icon: <FiSend className="w-3 h-3" /> },
    { id: 'analyst', name: 'Data Analyst', icon: <FiSquare className="w-3 h-3" /> },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowModelDropdown(false);
        setModelSearch('');
        setActiveProvider('all');
      }
      if (personaDropdownRef.current && !personaDropdownRef.current.contains(event.target)) {
        setShowPersonaDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showModelDropdown && modelSearchRef.current) {
      setTimeout(() => modelSearchRef.current?.focus(), 50);
    }
  }, [showModelDropdown]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  // Get unique providers from models
  const providers = ['all', ...new Set(models.map(m => m.provider).filter(Boolean))];

  // Filter models
  const filteredModels = models.filter(m => {
    const matchesSearch = !modelSearch ||
      m.name?.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.id?.toLowerCase().includes(modelSearch.toLowerCase());
    const matchesProvider = activeProvider === 'all' || m.provider === activeProvider;
    return matchesSearch && matchesProvider;
  });

  // Separate featured and regular
  const featuredModels = filteredModels.filter(m => m.featured);
  const regularModels = filteredModels.filter(m => !m.featured);

  const formatContext = (ctx) => {
    if (!ctx) return '';
    if (ctx >= 1000000) return `${(ctx / 1000000).toFixed(1)}M`;
    if (ctx >= 1000) return `${Math.round(ctx / 1000)}K`;
    return String(ctx);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isLoading) {
      onSend(message.trim(), selectedPersona.id);
      setMessage('');
    }
  };

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      window.recognition?.stop();
    } else {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        window.recognition = recognition;
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage((prev) => prev + (prev ? ' ' : '') + transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const renderModelItem = (model) => (
    <button
      key={model.id}
      type="button"
      onClick={() => {
        onModelChange(model);
        setShowModelDropdown(false);
        setModelSearch('');
        setActiveProvider('all');
      }}
      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 transition-all duration-150 group ${selectedModel?.id === model.id
          ? 'bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300 ring-1 ring-primary-200 dark:ring-primary-500/30'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-night-800'
        }`}
    >
      {/* Provider dot */}
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PROVIDER_COLORS[model.provider] || PROVIDER_COLORS.other}`} />

      {/* Model info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold truncate text-[11px]">{model.name}</span>
          {model.featured && <FiStar className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />}
          {model.is_free && (
            <span className="px-1 py-0 text-[8px] font-bold bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded">FREE</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] text-gray-400 dark:text-gray-500 capitalize">{PROVIDER_LABELS[model.provider] || model.provider}</span>
          {model.context_length > 0 && (
            <span className="text-[9px] text-gray-400 dark:text-gray-500">{formatContext(model.context_length)} ctx</span>
          )}
          {model.pricing?.prompt && model.pricing.prompt !== 'N/A' && (
            <span className="text-[9px] text-gray-400 dark:text-gray-500">{model.pricing.prompt}</span>
          )}
        </div>
      </div>

      {/* Selected indicator */}
      {selectedModel?.id === model.id && (
        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0 animate-pulse" />
      )}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="p-2 border-t border-gray-100 dark:border-night-800 bg-white dark:bg-night-950/95 backdrop-blur-md relative z-20 transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-1.5">
        {/* Top bar: Model + Persona selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Model Selector Pill */}
          <div className="relative inline-block" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-night-900 border border-gray-100 dark:border-night-800 text-[10px] font-bold text-primary-600 dark:text-primary-400 hover:border-primary-400 transition-all shadow-sm"
            >
              <div className={`w-2 h-2 rounded-full ${PROVIDER_COLORS[selectedModel?.provider] || 'bg-primary-500'}`} />
              <span>{selectedModel?.name || 'Select Model'}</span>
              <FiChevronDown className={`w-2.5 h-2.5 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showModelDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-[360px] max-h-[420px] bg-white dark:bg-night-900 border border-gray-100 dark:border-night-800 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] z-30 ring-1 ring-black/5 dark:ring-white/5 flex flex-col overflow-hidden">

                {/* Header */}
                <div className="px-4 pt-3 pb-2 border-b border-gray-100 dark:border-night-800">
                  <div className="flex items-center gap-2 mb-2">
                    <FiZap className="w-3.5 h-3.5 text-primary-500" />
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">AI Model Arena</span>
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 ml-auto">{models.length} models</span>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <input
                      ref={modelSearchRef}
                      type="text"
                      placeholder="Search models..."
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-night-800 border border-gray-100 dark:border-night-700 rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                    />
                  </div>
                </div>

                {/* Provider Tabs */}
                <div className="px-3 py-2 flex gap-1 overflow-x-auto border-b border-gray-50 dark:border-night-800 no-scrollbar">
                  {providers.slice(0, 9).map(prov => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => setActiveProvider(prov)}
                      className={`px-2 py-0.5 rounded-md text-[9px] font-bold whitespace-nowrap transition-all ${activeProvider === prov
                          ? 'bg-primary-500 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-night-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-night-700'
                        }`}
                    >
                      {PROVIDER_LABELS[prov] || prov}
                    </button>
                  ))}
                </div>

                {/* Model List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                  {/* Featured Section */}
                  {featuredModels.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-[9px] uppercase font-bold text-amber-500 dark:text-amber-400 tracking-wider flex items-center gap-1">
                        <FiStar className="w-2.5 h-2.5" /> Featured
                      </div>
                      {featuredModels.map(renderModelItem)}
                    </>
                  )}

                  {/* All Models */}
                  {regularModels.length > 0 && (
                    <>
                      {featuredModels.length > 0 && (
                        <div className="px-2 py-1 mt-1 text-[9px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                          All Models
                        </div>
                      )}
                      {regularModels.slice(0, 50).map(renderModelItem)}
                      {regularModels.length > 50 && (
                        <div className="text-center py-2 text-[9px] text-gray-400">
                          +{regularModels.length - 50} more models (use search to find them)
                        </div>
                      )}
                    </>
                  )}

                  {filteredModels.length === 0 && (
                    <div className="text-center py-6 text-xs text-gray-400 dark:text-gray-500">
                      No models found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Persona Selector Pill */}
          <div className="relative inline-block" ref={personaDropdownRef}>
            <button
              type="button"
              onClick={() => setShowPersonaDropdown(!showPersonaDropdown)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white dark:bg-night-900 border border-gray-100 dark:border-night-800 text-[10px] font-bold text-accent-purple hover:border-accent-purple/50 transition-all shadow-sm"
            >
              {selectedPersona.icon}
              <span>{selectedPersona.name}</span>
              <FiChevronDown className={`w-2.5 h-2.5 transition-transform ${showPersonaDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showPersonaDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-night-900 border border-gray-100 dark:border-night-800 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-none p-2 z-30 ring-1 ring-black/5 dark:ring-white/5">
                <div className="px-3 py-2 text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">System Persona</div>
                {personas.map((persona) => (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => {
                      setSelectedPersona(persona);
                      setShowPersonaDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center gap-3 transition-colors ${selectedPersona.id === persona.id ? 'bg-primary-50 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-night-800'
                      }`}
                  >
                    <div className={`w-2 h-2 rounded-full ring-2 ring-offset-1 ${selectedPersona.id === persona.id ? 'bg-primary-500 ring-primary-200 dark:ring-primary-500/30' : 'bg-gray-300 dark:bg-gray-600 ring-transparent'}`} />
                    <span className="flex-1 truncate">{persona.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="flex items-end gap-2 bg-white dark:bg-night-900 rounded-lg border border-gray-100 dark:border-night-800 p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary-500/10 transition-all duration-300 relative">
          {/* Slash Command Menu */}
          <SlashCommandMenu
            isOpen={showSlashMenu}
            query={slashQuery}
            onSelect={(content) => {
              setMessage(content);
              setShowSlashMenu(false);
              setSlashQuery('');
              textareaRef.current?.focus();
            }}
            onClose={() => {
              setShowSlashMenu(false);
              setSlashQuery('');
            }}
          />
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              const val = e.target.value;
              setMessage(val);

              // Detect slash commands
              if (val.startsWith('/')) {
                setShowSlashMenu(true);
                setSlashQuery(val.slice(1));
              } else {
                setShowSlashMenu(false);
                setSlashQuery('');
              }
            }}
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

          <button
            type="button"
            onClick={toggleListening}
            className={`p-1.5 rounded-md transition-all duration-200 flex items-center justify-center ${isListening
              ? 'bg-red-500 text-white animate-pulse shadow-md'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-night-800'
              }`}
            title="Voice Input"
          >
            {isListening ? <FiMicOff className="w-3.5 h-3.5" /> : <FiMic className="w-3.5 h-3.5" />}
          </button>

          {/* Prompt Library Button */}
          {onOpenPromptLibrary && (
            <button
              type="button"
              onClick={onOpenPromptLibrary}
              className="p-1.5 rounded-md text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-night-800 transition-all duration-200 flex items-center justify-center"
              title="Prompt Library (Forge)"
            >
              <FiBookOpen className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="text-[9px] text-gray-400 dark:text-gray-500 text-center font-medium opacity-60">
          ByteForge AI can make mistakes. Powered by OpenRouter — 400+ AI models.
        </p>
      </div>
    </form>
  );
};

export default ChatInput;