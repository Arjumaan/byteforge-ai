import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDate, truncateText } from '../utils/helpers';

const Sidebar = ({ conversations, activeConversation, onSelectConversation, onNewConversation }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-80 bg-dark-surface h-screen flex flex-col border-r border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">ByteForge AI</h1>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white text-sm"
            title="Logout"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
        
        <button
          onClick={onNewConversation}
          className="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg transition duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Conversation
        </button>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{user?.display_name || user?.email}</p>
            <p className="text-gray-400 text-sm truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <h2 className="text-gray-400 text-xs uppercase font-semibold mb-2 px-2">Recent Conversations</h2>
          
          {conversations.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Start a new conversation</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv)}
                  className={`w-full text-left p-3 rounded-lg transition duration-200 ${
                    activeConversation?.id === conv.id
                      ? 'bg-dark-hover border border-primary'
                      : 'hover:bg-dark-hover'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-white font-medium truncate flex-1">
                      {truncateText(conv.title, 30)}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{formatDate(conv.updated_at)}</span>
                    <span className="text-gray-500">{conv.message_count || 0} msgs</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-600 rounded-full">
                        <div
                          className={`h-full rounded-full ${
                            (conv.total_tokens_used / conv.token_limit) * 100 < 50
                              ? 'bg-green-500'
                              : (conv.total_tokens_used / conv.token_limit) * 100 < 80
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{
                            width: `${Math.min((conv.total_tokens_used / conv.token_limit) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-gray-500 text-xs">
                        {Math.round((conv.total_tokens_used / conv.token_limit) * 100)}%
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Links */}
      <div className="p-4 border-t border-gray-700">
        <div className="space-y-2">
          <button
            onClick={() => navigate('/profile')}
            className="w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-dark-hover rounded transition duration-200"
          >
            Profile
          </button>
          {user?.is_admin && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-dark-hover rounded transition duration-200"
            >
              Admin Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
