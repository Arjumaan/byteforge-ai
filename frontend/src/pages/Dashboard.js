import React, { useState, useEffect, useRef } from 'react';
import $ from 'jquery';
import Sidebar from '../components/Sidebar';
import ChatMessage from '../components/ChatMessage';
import PaymentModal from '../components/PaymentModal';
import { chatAPI } from '../services/api';
import { getTokenUsageColor } from '../utils/helpers';

const Dashboard = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [tokenUsage, setTokenUsage] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeConversation) {
      loadConversationHistory(activeConversation.id);
      loadTokenUsage(activeConversation.id);
    }
  }, [activeConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const data = await chatAPI.getConversations();
      setConversations(data);
      
      // Auto-select first conversation if available
      if (data.length > 0 && !activeConversation) {
        setActiveConversation(data[0]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversationHistory = async (conversationId) => {
    try {
      const data = await chatAPI.getConversationHistory(conversationId);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const loadTokenUsage = async (conversationId) => {
    try {
      const data = await chatAPI.getTokenUsage(conversationId);
      setTokenUsage(data);
    } catch (error) {
      console.error('Failed to load token usage:', error);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await chatAPI.createConversation('New Conversation');
      setConversations([newConv, ...conversations]);
      setActiveConversation(newConv);
      setMessages([]);
      setTokenUsage({
        total_tokens_used: 0,
        token_limit: 20000,
        tokens_remaining: 20000,
        percentage_used: 0,
      });
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !activeConversation) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setLoading(true);
    setIsTyping(true);

    try {
      // Send message using jQuery AJAX
      const response = await chatAPI.sendMessage(activeConversation.id, userMessage);
      
      // Update messages
      setMessages([...messages, response.user_message, response.ai_response]);
      
      // Update conversation in list
      const updatedConversations = conversations.map(conv =>
        conv.id === activeConversation.id ? response.conversation : conv
      );
      setConversations(updatedConversations);
      setActiveConversation(response.conversation);
      
      // Reload token usage
      await loadTokenUsage(activeConversation.id);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Check if token limit reached
      if (error.data?.token_limit_reached) {
        setShowPaymentModal(true);
      } else {
        alert(error.message || 'Failed to send message');
      }
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handlePaymentSuccess = async () => {
    // Reload conversation and token usage
    await loadConversations();
    if (activeConversation) {
      await loadTokenUsage(activeConversation.id);
      
      // Update active conversation with new token limit
      const updatedConv = await chatAPI.getConversationHistory(activeConversation.id);
      setActiveConversation(updatedConv.conversation);
    }
  };

  const tokenPercentage = tokenUsage ? tokenUsage.percentage_used : 0;
  const tokenColor = getTokenUsageColor(tokenPercentage);

  return (
    <div className="flex h-screen bg-dark-bg">
      <Sidebar
        conversations={conversations}
        activeConversation={activeConversation}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />

      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-dark-surface border-b border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">{activeConversation.title}</h2>
                  <p className="text-sm text-gray-400">
                    {messages.length} messages
                  </p>
                </div>
                
                {/* Token Usage Bar */}
                {tokenUsage && (
                  <div className="w-64">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-400">Token Usage</span>
                      <span className="text-gray-300 font-mono">
                        {tokenUsage.total_tokens_used.toLocaleString()} / {tokenUsage.token_limit.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${tokenColor} transition-all duration-300`}
                        style={{ width: `${Math.min(tokenPercentage, 100)}%` }}
                      ></div>
                    </div>
                    {tokenPercentage > 80 && (
                      <p className="text-xs text-yellow-500 mt-1">
                        Warning: Approaching token limit
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                        <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Start a Conversation</h3>
                    <p className="text-gray-400">Send a message to begin chatting with ByteForge AI</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      isUser={msg.role === 'user'}
                    />
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start mb-4">
                      <div className="flex gap-3 max-w-3xl">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                          </svg>
                        </div>
                        <div className="bg-dark-surface border border-gray-700 rounded-lg px-4 py-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="bg-dark-surface border-t border-gray-700 p-4">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={loading}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Welcome to ByteForge AI</h2>
              <p className="text-gray-400 mb-6">Select a conversation or start a new one</p>
              <button
                onClick={handleNewConversation}
                className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition duration-200"
              >
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        conversation={activeConversation}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default Dashboard;
