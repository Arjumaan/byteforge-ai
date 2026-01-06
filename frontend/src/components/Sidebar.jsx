import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiMessageSquare, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const Sidebar = ({ onNewConversation, onConversationSelect, refreshTrigger }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const { conversationId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, [refreshTrigger]);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/chat/conversations/');
      setConversations(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    onNewConversation?.();
    navigate('/chat');
  };

  const handleDeleteConversation = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      await api.delete(`/chat/conversations/${id}/`);
      toast.success('Conversation deleted');
      fetchConversations();

      if (conversationId === String(id)) {
        navigate('/chat');
      }
    } catch (error) {
      toast.error('Failed to delete conversation');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return date.toLocaleDateString();
  };

  if (collapsed) {
    return (
      <div className="w-20 bg-gray-50 dark:bg-night-800 border-r border-gray-200 dark:border-night-900 flex flex-col items-center py-6 shadow-sm z-50 transition-colors duration-300">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2.5 text-gray-400 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-night-900 rounded-xl mb-6 shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-night-900 transition-all"
        >
          <FiChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={handleNewConversation}
          className="p-3.5 bg-gradient-to-br from-primary-500 to-primary-600 hover:shadow-lg hover:shadow-primary-500/30 rounded-2xl text-white transition-all transform hover:scale-105 active:scale-95"
          title="New Chat"
        >
          <FiPlus className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-72 bg-gray-50 dark:bg-night-800 border-r border-gray-200 dark:border-night-900 flex flex-col h-full z-40 transition-all duration-300">
      {/* Header */}
      <div className="p-5 border-b border-gray-200/50 dark:border-night-900 flex items-center justify-between">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg tracking-tight">Conversations</h2>
        <button
          onClick={() => setCollapsed(true)}
          className="p-2 text-gray-400 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-night-900 rounded-lg transition-all"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* New Conversation Button */}
      <div className="p-5 pb-2">
        <button
          onClick={handleNewConversation}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white dark:bg-night-900 border border-gray-200 dark:border-night-800 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-md rounded-xl text-primary-600 dark:text-primary-400 font-semibold transition-all duration-200 group"
        >
          <FiPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 dark:bg-night-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiMessageSquare className="w-5 h-5 text-gray-400 dark:text-gray-500 opacity-50" />
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-400 font-medium">No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                to={`/chat/${conv.id}`}
                onClick={() => onConversationSelect?.(conv)}
                className={`group relative flex items-start gap-3 p-3.5 rounded-xl transition-all duration-200 border ${conversationId === String(conv.id)
                  ? 'bg-white dark:bg-night-900 border-primary-200 dark:border-night-800 shadow-sm ring-1 ring-primary-50 dark:ring-night-800'
                  : 'bg-transparent border-transparent hover:bg-white dark:hover:bg-night-900 hover:border-gray-100 dark:hover:border-night-800 hover:shadow-sm'
                  }`}
              >
                <FiMessageSquare className={`w-4 h-4 mt-1 flex-shrink-0 transition-colors ${conversationId === String(conv.id) ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500 group-hover:text-primary-400'
                  }`} />

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate transition-colors ${conversationId === String(conv.id) ? 'text-primary-900 dark:text-primary-100' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                    }`}>
                    {conv.title}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 font-medium">
                    {formatDate(conv.updated_at)}
                  </p>
                </div>

                <button
                  onClick={(e) => handleDeleteConversation(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 absolute right-2 top-3 p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                  title="Delete conversation"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;