import api from './api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const authService = {
  // Get OAuth URLs
  getGoogleAuthUrl: () => `${API_URL}/oauth/login/google-oauth2/`,
  getGitHubAuthUrl: () => `${API_URL}/oauth/login/github/`,
  getAppleAuthUrl: () => `${API_URL}/oauth/login/apple-id/`,
  getGitLabAuthUrl: () => `${API_URL}/oauth/login/gitlab/`,
  
  // Handle OAuth callback
  handleOAuthCallback: async (provider, code) => {
    const response = await api.get(`/auth/oauth/callback/?provider=${provider}&code=${code}`);
    return response.data;
  },
};

export default authService;