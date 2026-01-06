import React, { useMemo } from 'react';
import { FiUser, FiCornerDownRight } from 'react-icons/fi';
import logo from '../assets/logo.png';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from '../context/ThemeContext';

const ChatMessage = ({ message = {}, isTyping = false, onSuggestionClick }) => {
  const { theme } = useTheme();
  const currentTheme = theme || 'light';
  const isDark = currentTheme === 'dark';
  const isUser = message?.role === 'user';
  const textColor = isDark ? '#ffffff' : '#000000';

  const MarkdownComponents = useMemo(() => ({
    code: ({ node, inline, className, children, ...props }) => {
      if (inline) {
        return (
          <code className="chat-code-block rounded px-1.5 py-0.5 font-mono text-sm border" {...props}>
            {children}
          </code>
        );
      }
      return (
        <code className="chat-code-block block rounded-lg p-4 mb-4 overflow-x-auto font-mono text-sm border" {...props}>
          {children}
        </code>
      );
    },
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium break-all" style={{ color: '#3b82f6' }}>{children}</a>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto mb-4 border border-gray-300 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-gray-100 dark:bg-gray-800 font-bold" style={{ color: textColor }}>{children}</thead>,
    tbody: ({ children }) => <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-black">{children}</tbody>,
    tr: ({ children }) => <tr className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">{children}</tr>,
    th: ({ children }) => <th className="px-4 py-3 text-left" style={{ color: textColor }}>{children}</th>,
    td: ({ children }) => <td className="px-4 py-3 whitespace-pre-wrap" style={{ color: textColor }}>{children}</td>,
    blockquote: ({ children }) => (
      <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 my-4">
        <div className="italic" style={{ color: textColor }}>{children}</div>
      </div>
    ),
    p: ({ children }) => <p className="mb-4 last:mb-0 leading-7" style={{ color: textColor }}>{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1" style={{ color: textColor }}>{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1" style={{ color: textColor }}>{children}</ol>,
    li: ({ children }) => <li className="pl-1" style={{ listStylePosition: 'outside', color: textColor }}>{children}</li>,
    h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6" style={{ color: textColor }}>{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5" style={{ color: textColor }}>{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-bold mb-3 mt-4" style={{ color: textColor }}>{children}</h3>,
    h4: ({ children }) => <h4 className="text-base font-bold mb-2 mt-3" style={{ color: textColor }}>{children}</h4>,
    strong: ({ children }) => <strong className="font-bold" style={{ color: textColor }}>{children}</strong>,
    em: ({ children }) => <em className="italic" style={{ color: textColor }}>{children}</em>,
  }), [textColor]);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isTyping) {
    return (
      <div className="flex gap-5 px-4 py-8 max-w-4xl mx-auto">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white dark:bg-night-900 shadow-sm border border-gray-100 dark:border-night-800 transition-colors">
          <img src={logo} alt="AI" className="w-6 h-6 object-contain" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm force-inherit" style={{ color: textColor }}>ByteForge AI</span>
          </div>
          <div className="flex gap-1.5 p-3 w-fit bg-gray-50 dark:bg-night-800 rounded-2xl rounded-tl-none transition-colors">
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
          </div>
        </div>
      </div>
    );
  }

  // Parse content to separate related suggestions
  const [mainContent, relatedContent] = (message?.content || '').split('===RELATED===');
  const relatedTopics = relatedContent
    ? relatedContent.split('\n').filter(line => line.trim().length > 0).map(line => line.replace(/^-\s*/, '').trim())
    : [];

  return (
    <div className="group flex gap-5 px-4 py-8 mb-2 rounded-2xl transition-colors bg-transparent">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border transition-colors ${isUser
        ? 'bg-gradient-to-br from-primary-500 to-primary-600 border-primary-500'
        : 'bg-white dark:bg-night-900 border-gray-100 dark:border-night-800'
        }`}>
        {isUser ? (
          <FiUser className="w-5 h-5 text-white" />
        ) : (
          <img src={logo} alt="AI" className="w-6 h-6 object-contain" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-bold text-sm force-inherit" style={{ color: textColor }}>
            {isUser ? 'You' : 'ByteForge AI'}
          </span>
          <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>
            {formatTime(message?.created_at)}
          </span>
          {message.tokens_used > 0 && (
            <span className="text-[10px] bg-gray-100 dark:bg-night-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
              {message.tokens_used} tokens
            </span>
          )}
        </div>

        <div className="text-[15px] leading-relaxed w-full force-inherit" style={{ color: textColor }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
            {mainContent}
          </ReactMarkdown>
        </div>

        {/* Related Suggestions Section */}
        {!isUser && relatedTopics.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: textColor }}>
              Related
            </h4>
            <div className="flex flex-col gap-2">
              {relatedTopics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick && onSuggestionClick(topic)}
                  className="flex items-start gap-3 p-2 text-left hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors group/item"
                >
                  <FiCornerDownRight className="w-4 h-4 mt-0.5 text-gray-400 group-hover/item:text-primary-500 transition-colors" />
                  <span className="text-sm font-medium opacity-90 group-hover/item:opacity-100 transition-opacity" style={{ color: textColor }}>
                    {topic}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
