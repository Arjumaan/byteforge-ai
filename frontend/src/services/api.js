import $ from 'jquery';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('access_token');
};

// Generic AJAX request function
const makeRequest = (method, endpoint, data = null, useAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (useAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return new Promise((resolve, reject) => {
    $.ajax({
      url: `${API_URL}${endpoint}`,
      method: method,
      headers: headers,
      data: data ? JSON.stringify(data) : null,
      success: (response) => {
        resolve(response);
      },
      error: (xhr) => {
        const error = {
          status: xhr.status,
          message: xhr.responseJSON?.error || xhr.responseJSON?.detail || 'An error occurred',
          data: xhr.responseJSON,
        };
        reject(error);
      },
    });
  });
};

// Authentication API
export const authAPI = {
  register: (data) => makeRequest('POST', '/auth/register', data, false),
  login: (data) => makeRequest('POST', '/auth/login', data, false),
  logout: (refreshToken) => makeRequest('POST', '/auth/logout', { refresh: refreshToken }),
  getProfile: () => makeRequest('GET', '/auth/profile'),
  updateProfile: (data) => makeRequest('PUT', '/auth/profile/update', data),
};

// Chat API
export const chatAPI = {
  getConversations: () => makeRequest('GET', '/chat/conversations'),
  createConversation: (title) => makeRequest('POST', '/chat/conversations', { title }),
  getConversationHistory: (conversationId) => makeRequest('GET', `/chat/conversations/${conversationId}/history`),
  sendMessage: (conversationId, message) => makeRequest('POST', '/chat/send', { conversation_id: conversationId, message }),
  getTokenUsage: (conversationId) => makeRequest('GET', `/chat/conversations/${conversationId}/token-usage`),
};

// Payment API
export const paymentAPI = {
  createPayment: (conversationId, amount, tokensToAdd) => 
    makeRequest('POST', '/payments/create', { conversation_id: conversationId, amount, tokens_to_add: tokensToAdd }),
  getPaymentHistory: () => makeRequest('GET', '/payments/history'),
};

// Admin API
export const adminAPI = {
  getDashboard: () => makeRequest('GET', '/admin/dashboard'),
};
