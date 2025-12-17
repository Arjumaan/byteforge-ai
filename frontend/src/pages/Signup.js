import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { isValidEmail, getPasswordStrength } from '../utils/helpers';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
    display_name: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.email || !formData.password || !formData.password2) {
      setError('Please fill in all required fields');
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      return;
    }

    const passwordStrength = getPasswordStrength(formData.password);
    if (passwordStrength.level === 'weak') {
      setError('Password is too weak. Use a mix of letters, numbers, and special characters.');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        email: formData.email,
        password: formData.password,
        password2: formData.password2,
        display_name: formData.display_name,
      });

      setSuccess('Account created successfully! Redirecting...');
      login(response.user, response.tokens);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.data?.email?.[0] || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = formData.password ? getPasswordStrength(formData.password) : null;

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">ByteForge AI</h1>
          <h2 className="text-2xl font-semibold text-gray-300">Create Account</h2>
          <p className="mt-2 text-gray-400">Join us to start your AI journey</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-dark-surface p-8 rounded-lg shadow-xl">
          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500 bg-opacity-10 border border-green-500 text-green-500 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-gray-300 mb-2">
                Display Name (Optional)
              </label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                value={formData.display_name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your Name"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your password"
              />
              {passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-600 rounded">
                      <div
                        className={`h-full rounded ${passwordStrength.color}`}
                        style={{
                          width: passwordStrength.level === 'weak' ? '33%' : 
                                 passwordStrength.level === 'medium' ? '66%' : '100%'
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400 capitalize">{passwordStrength.level}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="password2" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password *
              </label>
              <input
                id="password2"
                name="password2"
                type="password"
                value={formData.password2}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-dark-surface text-gray-400">Or sign up with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center px-4 py-2 border border-gray-600 rounded-lg hover:bg-dark-hover transition duration-200"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-2" />
              <span className="text-gray-300">Google</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center px-4 py-2 border border-gray-600 rounded-lg hover:bg-dark-hover transition duration-200"
            >
              <img src="https://github.com/favicon.ico" alt="GitHub" className="w-5 h-5 mr-2" />
              <span className="text-gray-300">GitHub</span>
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-primary-hover font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
