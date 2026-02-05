import React from 'react';
import { Link } from 'react-router-dom';
import { FiMessageSquare, FiClock, FiArrowRight } from 'react-icons/fi';

const ConversationList = ({ conversations, loading }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getUsageBg = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-dark-50 dark:bg-dark-200 animate-pulse rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-12 h-12 bg-dark-50 dark:bg-dark-200 rounded-full flex items-center justify-center mx-auto mb-3">
          <FiMessageSquare className="w-5 h-5 text-dark-300 dark:text-gray-500" />
        </div>
        <h3 className="text-sm font-bold text-dark-900 dark:text-gray-200 mb-1">No recent conversations</h3>
        <p className="text-xs text-dark-500 dark:text-gray-500 mb-4">Your search history and chats will appear here.</p>
        <Link
          to="/chat"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-primary-700 transition-colors"
        >
          <FiMessageSquare className="w-3.5 h-3.5" />
          Start Chatting
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {conversations.map((conv) => (
        <Link
          key={conv.id}
          to={`/chat/${conv.id}`}
          className="group block bg-white dark:bg-night-900 border border-gray-100 dark:border-night-800 rounded-xl p-4 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-md transition-all duration-200 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-primary-500 transition-colors"></div>

          <div className="flex items-start gap-4 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-50 dark:from-primary-500/20 to-primary-100 dark:to-primary-500/10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <FiMessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-sm mb-0.5">
                {conv.title}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <FiClock className="w-3 h-3" />
                {formatDate(conv.updated_at)}
              </p>
            </div>
            <FiArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-600 group-hover:text-primary-500 dark:group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
          </div>

          {conv.last_message && (
            <div className="bg-gray-50/50 dark:bg-night-800/50 rounded-lg p-2.5 mb-3 border border-gray-50 dark:border-night-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                {conv.last_message.content}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mt-auto">
            <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-night-800 px-2 py-0.5 rounded">
              {conv.message_count || 0} messages
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold ${getUsageColor(conv.usage_percentage)}`}>
                {conv.usage_percentage?.toFixed(0) || 0}%
              </span>
              <div className="w-12 h-1.5 bg-gray-100 dark:bg-night-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getUsageBg(conv.usage_percentage)}`}
                  style={{ width: `${conv.usage_percentage || 0}%` }}
                />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ConversationList;