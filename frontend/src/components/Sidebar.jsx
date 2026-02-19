import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiMessageSquare, FiTrash2, FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const Sidebar = ({ onNewConversation, onConversationSelect, refreshTrigger }) => {
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { conversationId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, [refreshTrigger]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conv =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/chat/conversations/');
      setConversations(response.data.results || response.data || []);
      setFilteredConversations(response.data.results || response.data || []);
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
      <div className="w-10 bg-gray-50 dark:bg-night-800 border-r border-gray-100 dark:border-night-900 flex flex-col items-center py-2 shadow-sm z-50">
        <button
          onClick={() => setCollapsed(false)}
          className="p-1 text-gray-400 hover:text-primary-600 mb-2"
        >
          <FiChevronRight className="w-3 h-3" />
        </button>
        <button
          onClick={handleNewConversation}
          className="p-1.5 bg-primary-600 rounded text-white"
        >
          <FiPlus className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-44 bg-gray-50 dark:bg-night-800 border-r border-gray-100 dark:border-night-900 flex flex-col h-full z-40 transition-all">
      {/* Header */}
      <div className="p-2 py-1.5 border-b border-gray-100 dark:border-night-900 flex items-center justify-between">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-[11px] uppercase tracking-tighter">History</h2>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 text-gray-400 hover:text-primary-600"
        >
          <FiChevronLeft className="w-3 h-3" />
        </button>
      </div>

      {/* New Conversation Button */}
      <div className="p-2 pb-1">
        <button
          onClick={handleNewConversation}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-white dark:bg-night-900 border border-gray-100 dark:border-night-800 rounded text-primary-600 font-bold text-[11px] transition-all"
        >
          <FiPlus className="w-3 h-3" />
          <span>New Chat</span>
        </button>
      </div>


      {/* Search Input */}
      {
        !loading && conversations.length > 0 && (
          <div className="px-2 pb-2">
            <div className="relative">
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-night-900 border border-gray-100 dark:border-night-800 rounded pl-7 pr-2 py-1.5 text-[10px] text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
              />
            </div>
          </div>
        )
      }

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-10 h-10 bg-gray-100 dark:bg-night-900 rounded-full flex items-center justify-center mx-auto mb-2">
              <FiMessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-50" />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-400 font-medium">No conversations yet</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400 dark:text-gray-400 font-medium">No results found</p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredConversations.map((conv) => (
              <Link
                key={conv.id}
                to={`/chat/${conv.id}`}
                onClick={() => onConversationSelect?.(conv)}
                className={`group relative flex items-start gap-2.5 p-2 rounded-lg transition-all duration-200 border ${conversationId === String(conv.id)
                  ? 'bg-white dark:bg-night-900 border-primary-100 dark:border-night-800 shadow-sm ring-1 ring-primary-50 dark:ring-night-800'
                  : 'bg-transparent border-transparent hover:bg-white dark:hover:bg-night-900 hover:border-gray-100 dark:hover:border-night-800 hover:shadow-sm'
                  }`}
              >
                <FiMessageSquare className={`w-3 h-3 mt-0.5 flex-shrink-0 transition-colors ${conversationId === String(conv.id) ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500 group-hover:text-primary-400'
                  }`} />

                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-medium truncate transition-colors ${conversationId === String(conv.id) ? 'text-primary-900 dark:text-primary-100' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                    }`}>
                    {conv.title}
                  </p>
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                    {formatDate(conv.updated_at)}
                  </p>
                </div>

                <button
                  onClick={(e) => handleDeleteConversation(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 absolute right-1.5 top-2.5 p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                  title="Delete conversation"
                >
                  <FiTrash2 className="w-3 h-3" />
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