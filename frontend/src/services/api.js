import axios from 'axios';

const isProduction = process.env.NODE_ENV === 'production';
let API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// If API_URL is just a hostname (from Render), add https://
if (API_URL && !API_URL.startsWith('http')) {
  API_URL = `https://${API_URL}`;
}

// Ensure /api suffix
if (!API_URL.endsWith('/api')) {
  API_URL += '/api';
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      const { access } = JSON.parse(tokens);
      if (access) {
        config.headers.Authorization = `Bearer ${access}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = localStorage.getItem('tokens');
        if (tokens) {
          const { refresh } = JSON.parse(tokens);

          const response = await axios.post(`${API_URL}/auth/refresh/`, {
            refresh,
          });

          const newTokens = {
            access: response.data.access,
            refresh: response.data.refresh || refresh,
          };

          localStorage.setItem('tokens', JSON.stringify(newTokens));
          originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('tokens');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;