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
    { id: 'gemini-flash-latest', name: 'Gemini Flash (Default)', provider: 'gemini' },
    { id: 'gemini-pro', name: 'Gemini Pro', provider: 'gemini' },
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Exp)', provider: 'gemini' },
    { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic' },
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
          <div className="flex items-center justify-between px-8 py-5 border-b border-dark-200 dark:border-night-800 bg-white/80 dark:bg-night-950/80 backdrop-blur-md z-20">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg shadow-primary-500/20 text-white">
                <FiMessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-dark-900 dark:text-gray-100 tracking-tight">
                  {conversation?.title || 'New Conversation'}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm animate-pulse-slow"></span>
                  <p className="text-xs font-medium text-dark-400 dark:text-gray-400">
                    {messages.length} messages
                  </p>
                </div>
              </div>
            </div>
            <div className="w-72">
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

              <div className="flex flex-col items-center justify-center h-full gap-5">
                <div className="w-12 h-12 border-4 border-primary-100 dark:border-dark-300 border-t-primary-500 rounded-full animate-spin"></div>
                <p className="text-dark-400 dark:text-gray-400 font-medium animate-pulse">Initializing Interface...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 relative z-0">
                <div className="w-28 h-28 bg-white dark:bg-night-900 rounded-[2rem] flex items-center justify-center mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-dark-100 dark:border-night-800 transition-colors">
                  <img src={logo} alt="ByteForge AI" className="w-14 h-14 object-contain" />
                </div>
                <h2 className="text-4xl font-extrabold text-dark-900 dark:text-white mb-4 tracking-tight">
                  Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">ByteForge AI</span>
                </h2>
                <p className="text-dark-400 dark:text-gray-400 max-w-lg mb-12 text-lg leading-relaxed">
                  Your professional AI workspace. Accelerate development, debug instantly, and explore creative solutions.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
                  {[
                    { title: 'Explain Quantum Computing', icon: '🌌', desc: 'Dive into complex physics' },
                    { title: 'Write a Python script', icon: '🐍', desc: 'Automate tasks easily' },
                    { title: 'Debug React Component', icon: '🐞', desc: 'Fix bugs in seconds' },
                    { title: 'Architect System Design', icon: '🏗️', desc: 'Plan scalable apps' },
                  ].map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(item.title)}
                      className="group p-5 text-left bg-white dark:bg-night-900 border border-dark-200 dark:border-night-800 hover:border-primary-400 dark:hover:border-primary-500 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1"
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-2xl p-3 bg-primary-50 dark:bg-primary-500/10 rounded-xl group-hover:bg-primary-100 dark:group-hover:bg-primary-500/20 transition-colors">{item.icon}</span>
                        <div>
                          <span className="block font-bold text-dark-900 dark:text-gray-100 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{item.title}</span>
                          <span className="text-xs text-dark-400 dark:text-gray-500 font-medium">{item.desc}</span>
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