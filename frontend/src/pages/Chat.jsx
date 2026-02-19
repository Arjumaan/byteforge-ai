import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import TokenUsageBar from '../components/TokenUsageBar';
import PaymentModal from '../components/PaymentModal';
import api from '../services/api';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';
import { FiMessageSquare, FiDownload } from 'react-icons/fi';
import { jsPDF } from "jspdf";
import PromptLibraryModal from '../components/PromptLibraryModal';

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
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);

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

  // Dynamic model list - fetched from backend (OpenRouter integration)
  const [models, setModels] = useState([
    { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openai', featured: true },
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'google', featured: true },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', featured: true },
  ]);
  const [selectedModel, setSelectedModel] = useState({ id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openai' });

  // Fetch available models from backend
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await api.get('/chat/models/');
        if (response.data.success && response.data.models?.length > 0) {
          setModels(response.data.models);
          // Set default to first featured model, or first model
          const featured = response.data.models.find(m => m.featured);
          if (featured && !selectedModel?.id) {
            setSelectedModel(featured);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch models, using defaults:', error.message);
      }
    };
    fetchModels();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendMessage = async (content, persona = 'general') => {
    if (!content.trim() || sending) return;

    setSending(true);

    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    // Create a placeholder for the streaming assistant message
    const tempAssistantMsg = {
      id: `temp-ai-${Date.now()}`,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);

    try {
      const tokens = JSON.parse(localStorage.getItem('tokens'));
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

      const response = await fetch(`${apiUrl}/chat/stream/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.access}`,
        },
        body: JSON.stringify({
          message: content,
          conversation_id: conversation?.id || null,
          provider: selectedModel.provider,
          model: selectedModel.id,
          persona: persona,
        }),
      });

      if (!response.ok) {
        // Handle non-streaming errors (402, 400, etc.)
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 402) {
          setTokenUsage(errorData.token_usage);
          setShowPaymentModal(true);
          toast.error('Token limit reached. Please top up to continue.');
        } else {
          toast.error(errorData.message || errorData.error || 'Failed to send message');
        }
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id && m.id !== tempAssistantMsg.id));
        setSending(false);
        return;
      }

      // Read the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === 'token') {
              // Append token to the streaming message
              fullContent += event.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === tempAssistantMsg.id
                    ? { ...m, content: fullContent }
                    : m
                )
              );
            } else if (event.type === 'done') {
              // Stream complete — replace temp messages with real ones
              setMessages((prev) => {
                const filtered = prev.filter(
                  (m) => m.id !== tempUserMsg.id && m.id !== tempAssistantMsg.id
                );
                return [...filtered, event.user_message, event.assistant_message];
              });
              setConversation(event.conversation);
              setTokenUsage(event.token_usage);

              if (!conversationId && event.conversation?.id) {
                navigate(`/chat/${event.conversation.id}`, { replace: true });
              }
              setRefreshSidebar((prev) => prev + 1);
            } else if (event.type === 'error') {
              toast.error(event.message || 'AI generation failed');
              // Keep the partial response if any content was streamed
              if (!fullContent) {
                setMessages((prev) =>
                  prev.filter((m) => m.id !== tempUserMsg.id && m.id !== tempAssistantMsg.id)
                );
              }
            }
          } catch (parseErr) {
            // Skip malformed SSE events
          }
        }
      }
    } catch (err) {
      console.error('Stream error:', err);
      toast.error('Connection lost. Please try again.');
      setMessages((prev) =>
        prev.filter((m) => m.id !== tempUserMsg.id && m.id !== `temp-ai-${tempUserMsg.id}`)
      );
    } finally {
      setSending(false);
    }
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

  const exportChat = () => {
    if (!messages.length) return;

    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(16);
    doc.text(conversation?.title || "Chat Export", 10, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, yPos);
    yPos += 20;

    doc.setFontSize(12);

    messages.forEach((msg) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      const role = msg.role === 'user' ? 'You' : 'AI';
      const color = msg.role === 'user' ? [0, 0, 255] : [0, 128, 0];

      doc.setTextColor(...color);
      doc.text(`${role}:`, 10, yPos);
      yPos += 7;

      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(msg.content, 180);
      doc.text(lines, 10, yPos);
      yPos += (lines.length * 7) + 10;
    });

    doc.save(`chat-export-${conversation?.id || 'new'}.pdf`);
    toast.success("Chat exported to PDF");
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
            <div className="flex items-center gap-3">
              <button
                onClick={exportChat}
                className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md transition-colors"
                title="Export Chat to PDF"
              >
                <FiDownload className="w-4 h-4" />
              </button>
              <div className="max-w-[150px]">
                <TokenUsageBar
                  used={tokenUsage.total_tokens_used}
                  limit={tokenUsage.token_limit}
                  onTopUp={() => setShowPaymentModal(true)}
                />
              </div>
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
            onOpenPromptLibrary={() => setShowPromptLibrary(true)}
          />
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        conversationId={conversation?.id}
        onSuccess={handlePaymentSuccess}
      />
      <PromptLibraryModal
        isOpen={showPromptLibrary}
        onClose={() => setShowPromptLibrary(false)}
        onSelectPrompt={(content) => {
          // Send the prompt content as a message
          handleSendMessage(content);
        }}
      />
    </div >
  );
};

export default Chat;