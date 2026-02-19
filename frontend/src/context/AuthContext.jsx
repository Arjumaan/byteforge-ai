import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(() => {
    const savedTokens = localStorage.getItem('tokens');
    return savedTokens ? JSON.parse(savedTokens) : null;
  });

  useEffect(() => {
    const initAuth = async () => {
      if (tokens?.access) {
        try {
          // Check if token is expired
          const decoded = jwtDecode(tokens.access);
          const currentTime = Date.now() / 1000;

          if (decoded.exp < currentTime) {
            // Token expired, try to refresh
            await refreshToken();
          } else {
            // Token valid, fetch user profile
            await fetchUserProfile();
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/profile/');
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      logout();
    }
  };

  const refreshToken = async () => {
    try {
      const response = await api.post('/auth/refresh/', {
        refresh: tokens.refresh,
      });

      const newTokens = {
        access: response.data.access,
        refresh: response.data.refresh || tokens.refresh,
      };

      setTokens(newTokens);
      localStorage.setItem('tokens', JSON.stringify(newTokens));
      await fetchUserProfile();
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
    }
  };

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await api.post('/auth/login/', {
        email,
        password,
        remember_me: rememberMe,
      });

      if (response.data.success) {
        const { user: userData, tokens: newTokens } = response.data;
        setUser(userData);
        setTokens(newTokens);
        localStorage.setItem('tokens', JSON.stringify(newTokens));
        return { success: true };
      }

      if (response.data.requires_verification) {
        return {
          success: false,
          requires_verification: true,
          email: response.data.email || email,
          message: response.data.message || 'Verification required'
        };
      }

      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error) {
      console.error('Login error in AuthContext:', error);

      const responseData = error.response?.data;

      if (responseData && typeof responseData === 'object' && responseData.requires_verification) {
        return {
          success: false,
          requires_verification: true,
          email: responseData.email || email,
          message: responseData.message || 'Verification required'
        };
      }

      const errorMessage = responseData?.message || error.message || 'Login failed';
      return { success: false, message: errorMessage };
    }
  };

  const register = async (email, password, passwordConfirm, displayName) => {
    try {
      const response = await api.post('/auth/register/', {
        email,
        password,
        password_confirm: passwordConfirm,
        display_name: displayName,
      });

      if (response.data.success) {
        // Registration successful - requires email verification
        if (response.data.requires_verification) {
          return {
            success: true,
            requires_verification: true,
            email: response.data.email,
            message: response.data.message
          };
        }

        // OAuth user (already verified) - auto login
        const { user: userData, tokens: newTokens } = response.data;
        if (newTokens) {
          setUser(userData);
          setTokens(newTokens);
          localStorage.setItem('tokens', JSON.stringify(newTokens));
        }
        return { success: true };
      }

      return { success: false, errors: response.data };
    } catch (error) {
      return { success: false, errors: error.response?.data || { message: 'Registration failed' } };
    }
  };

  const logout = async () => {
    try {
      if (tokens?.refresh) {
        await api.post('/auth/logout/', { refresh: tokens.refresh });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setTokens(null);
      localStorage.removeItem('tokens');
    }
  };

  const updateProfile = async (data) => {
    const response = await api.put('/auth/profile/', data);
    if (response.data.success) {
      setUser(response.data.user);
      return { success: true };
    }
    return { success: false, message: response.data.message };
  };

  const setOAuthTokens = (newTokens) => {
    setTokens(newTokens);
    localStorage.setItem('tokens', JSON.stringify(newTokens));
    fetchUserProfile();
  };

  const value = {
    user,
    tokens,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin || user?.email === 'admin@byteforge.com',
    login,
    register,
    logout,
    updateProfile,
    setOAuthTokens,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};