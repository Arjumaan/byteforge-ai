import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import $ from 'jquery';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import TokenUsageBar from '../components/TokenUsageBar';
import PaymentModal from '../components/PaymentModal';
import api from '../services/api';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';
import { FiMessageSquare } from 'react-icons/fi';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [tokenUsage, setTokenUsage] = useState({
    total_tokens_used: 0,
    token_limit: 20000,
    remaining_tokens: 20000,
    usage_percentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [refreshSidebar, setRefreshSidebar] = useState(0);

  const { conversationId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const fetchConversation = async (id) => {
      setLoading(true);
      try {
        const response = await api.get(`/chat/conversations/${id}/`);
        if (response.data.success) {
          const conv = response.data.conversation;
          setConversation(conv);
          setMessages(conv.messages || []);
          setTokenUsage({
            total_tokens_used: conv.total_tokens_used,
            token_limit: conv.token_limit,
            remaining_tokens: conv.remaining_tokens,
            usage_percentage: conv.usage_percentage,
          });
        }
      } catch (error) {
        toast.error('Failed to load conversation');
        navigate('/chat');
      } finally {
        setLoading(false);
      }
    };

    if (conversationId) {
      fetchConversation(conversationId);
    } else {
      setMessages([]);
      setConversation(null);
      setTokenUsage({
        total_tokens_used: 0,
        token_limit: 20000,
        remaining_tokens: 20000,
        usage_percentage: 0,
      });
      setLoading(false);
    }
  }, [conversationId, navigate]);

  const models = [
    { id: 'gemini-flash-latest', name: 'Gemini 1.5 Flash (Default)', provider: 'gemini' },
    { id: 'gemini-pro-latest', name: 'Gemini 1.5 Pro', provider: 'gemini' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini' },
    { id: 'gemini-exp-1206', name: 'Gemini Experimental', provider: 'gemini' },
    { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', warning: true },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
  ];

  const [selectedModel, setSelectedModel] = useState(models[0]);

  const handleSendMessage = async (content) => {
    if (!content.trim() || sending) return;

    setSending(true);

    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    $.ajax({
      url: `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/chat/send/`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('tokens'))?.access}`,
      },
      data: JSON.stringify({
        message: content,
        conversation_id: conversation?.id || null,
        provider: selectedModel.provider,
        model: selectedModel.id
      }),
      success: (response) => {
        if (response.success) {
          setMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
            return [...filtered, response.user_message, response.assistant_message];
          });
          setConversation(response.conversation);
          setTokenUsage(response.token_usage);

          if (!conversationId && response.conversation?.id) {
            navigate(`/chat/${response.conversation.id}`, { replace: true });
          }

          setRefreshSidebar((prev) => prev + 1);
        }
        setSending(false);
      },
      error: (xhr) => {
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        if (xhr.status === 402) {
          const data = xhr.responseJSON;
          setTokenUsage(data.token_usage);
          setShowPaymentModal(true);
          toast.error('Token limit reached. Please top up to continue.');
        } else {
          toast.error(xhr.responseJSON?.message || 'Failed to send message');
        }
        setSending(false);
      },
    });
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversation(null);
    setTokenUsage({
      total_tokens_used: 0,
      token_limit: 20000,
      remaining_tokens: 20000,
      usage_percentage: 0,
    });
  };

  const handlePaymentSuccess = (data) => {
    setTokenUsage(data.token_usage);
    setConversation(data.conversation);
    toast.success('Tokens added successfully!');
  };

  return (
    <div className="h-screen flex flex-col bg-dark-50 dark:bg-night-950 font-sans text-dark-900 dark:text-gray-100 transition-colors duration-200">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          onNewConversation={handleNewConversation}
          onConversationSelect={(conv) => setConversation(conv)}
          refreshTrigger={refreshSidebar}
        />

        <div className="flex-1 flex flex-col bg-white dark:bg-night-950 relative shadow-xl rounded-tl-3xl z-10 overflow-hidden ml-[-10px] border border-dark-200 dark:border-night-800 transition-colors">
          {/* Subtle background pattern/gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white to-primary-100/30 dark:from-night-900 dark:via-night-950 dark:to-night-900 pointer-events-none"></div>

          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-dark-200 dark:border-night-800 bg-white/80 dark:bg-night-950/80 backdrop-blur-md z-20">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg shadow-primary-500/20 text-white">
                <FiMessageSquare className="w-3 h-3" />
              </div>
              <div className="min-w-0">
                <h2 className="text-[13px] font-bold text-dark-900 dark:text-gray-100 tracking-tight truncate">
                  {conversation?.title || 'New Conversation'}
                </h2>
                <div className="flex items-center gap-1 mt-0">
                  <span className="w-1 h-1 rounded-full bg-green-500 shadow-sm animate-pulse-slow"></span>
                  <p className="text-[8px] font-medium text-dark-400 dark:text-gray-400">
                    {messages.length} msg
                  </p>
                </div>
              </div>
            </div>
            <div className="max-w-[40%]">
              <TokenUsageBar
                used={tokenUsage.total_tokens_used}
                limit={tokenUsage.token_limit}
                onTopUp={() => setShowPaymentModal(true)}
              />
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth relative z-10"
          >
            {loading ? (

              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-10 h-10 border-4 border-primary-100 dark:border-dark-300 border-t-primary-500 rounded-full animate-spin"></div>
                <p className="text-sm text-dark-400 dark:text-gray-400 font-medium animate-pulse">Initializing Interface...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-full py-4 text-center px-4 relative z-0 overflow-y-auto">
                <div className="w-10 h-10 bg-white dark:bg-night-900 rounded-xl flex items-center justify-center mb-3 shadow-[0_4px_15px_rgb(0,0,0,0.04)] dark:shadow-none border border-dark-100 dark:border-night-800 transition-colors">
                  <img src={logo} alt="ByteForge AI" className="w-6 h-6 object-contain" />
                </div>
                <h2 className="text-xl font-extrabold text-dark-900 dark:text-white mb-1.5 tracking-tight">
                  Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">ByteForge AI</span>
                </h2>
                <p className="text-dark-400 dark:text-gray-400 max-w-xs mb-4 text-xs leading-snug">
                  Accelerate development with professional AI assistance.
                </p>

                <div className="grid grid-cols-2 gap-2 max-w-sm w-full">
                  {[
                    { title: 'Explain Quantum', icon: '🌌', desc: 'Dive into physics' },
                    { title: 'Python Script', icon: '🐍', desc: 'Automate tasks' },
                    { title: 'Debug React', icon: '🐞', desc: 'Fix bugs fast' },
                    { title: 'System Design', icon: '🏗️', desc: 'Plan scalable apps' },
                  ].map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(item.title)}
                      className="group p-2 text-left bg-white dark:bg-night-900 border border-dark-200 dark:border-night-800 hover:border-primary-400 rounded-lg transition-all duration-300 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base p-1 bg-primary-50 dark:bg-primary-500/10 rounded group-hover:bg-primary-100 transition-colors">{item.icon}</span>
                        <div className="min-w-0">
                          <span className="block font-bold text-[11px] text-dark-900 dark:text-gray-100 mb-0 group-hover:text-primary-600 truncate">{item.title}</span>
                          <span className="block text-[8px] text-dark-400 dark:text-gray-500 font-medium truncate">{item.desc}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onSuggestionClick={handleSendMessage}
                  />
                ))}

                {sending && <ChatMessage isTyping />}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            )}
          </div>

          <ChatInput
            onSend={handleSendMessage}
            disabled={tokenUsage.remaining_tokens <= 0}
            isLoading={sending}
            models={models}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        conversationId={conversation?.id}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default Chat;