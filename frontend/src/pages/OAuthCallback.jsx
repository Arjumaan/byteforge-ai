import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setOAuthTokens } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const errorMsg = searchParams.get('error');

    if (errorMsg) {
      setError(errorMsg);
      toast.error('Authentication failed:  ' + errorMsg);
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (accessToken && refreshToken) {
      setOAuthTokens({
        access:  accessToken,
        refresh: refreshToken,
      });
      toast.success('Login successful!');
      navigate('/chat', { replace: true });
    } else {
      setError('Invalid authentication response');
      toast.error('Authentication failed');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [searchParams, navigate, setOAuthTokens]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-300">
      <div className="text-center">
        {error ?  (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">✕</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Authentication Failed</h2>
            <p className="text-gray-400">{error}</p>
            <p className="text-gray-500 mt-2">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white mb-2">Completing Sign In</h2>
            <p className="text-gray-400">Please wait... </p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;