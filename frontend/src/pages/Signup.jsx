import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiCheck, FiArrowRight, FiCode, FiActivity, FiUsers } from 'react-icons/fi';
import { FaGoogle, FaGithub, FaApple, FaGitlab } from 'react-icons/fa';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';
import loginHeroBg from '../assets/login_hero_bg.png';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
    passwordConfirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'One number', test: (p) => /\d/.test(p) },
    { label: 'One special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const failedRequirements = passwordRequirements.filter((req) => !req.test(formData.password));
      if (failedRequirements.length > 0) {
        newErrors.password = 'Password does not meet all requirements';
      }
    }

    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await register(
        formData.email,
        formData.password,
        formData.passwordConfirm,
        formData.displayName
      );

      if (result.success) {
        toast.success('Account created successfully!');
        navigate('/chat');
      } else {
        if (result.errors) {
          const newErrors = {};
          Object.keys(result.errors).forEach((key) => {
            if (Array.isArray(result.errors[key])) {
              newErrors[key] = result.errors[key][0];
            } else {
              newErrors[key] = result.errors[key];
            }
          });
          setErrors(newErrors);
        }
      }
    } catch (err) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    let authUrl;
    switch (provider) {
      case 'google':
        authUrl = authService.getGoogleAuthUrl();
        break;
      case 'github':
        authUrl = authService.getGitHubAuthUrl();
        break;
      case 'apple':
        authUrl = authService.getAppleAuthUrl();
        break;
      case 'gitlab':
        authUrl = authService.getGitLabAuthUrl();
        break;
      default:
        return;
    }
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-dark-400 flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-dark-300">
        <div className="absolute inset-0">
          <img
            src={loginHeroBg}
            alt="AI Perspective"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-400 via-dark-400/50 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-dark-400/50 to-transparent"></div>
        </div>

        <div className="relative z-10 p-10 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center backdrop-blur-sm border border-primary-500/20">
                <img src={logo} alt="ByteForge" className="w-8 h-8 object-contain" />
              </div>
              <span className="text-3xl font-bold text-white tracking-wide">ByteForge AI</span>
            </div>

            <h1 className="text-5xl font-bold text-white leading-tight mb-4">
              Join the Future of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-purple">AI Development</span>
            </h1>
            <p className="text-lg text-gray-300 max-w-md leading-relaxed">
              Create your account today and start building smarter, faster, and more efficient applications with ByteForge AI.
            </p>
          </div>

          <div className="w-full">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4 text-gray-200 bg-dark-200/80 p-4 rounded-2xl border border-white/10 transform hover:scale-[1.02] transition-transform duration-200 shadow-lg">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
                  <FiCheck className="w-5 h-5" />
                </div>
                <span className="font-medium text-lg">Free Access to GPT-4 & Claude 3</span>
              </div>
              <div className="flex items-center gap-4 text-gray-200 bg-dark-200/80 p-4 rounded-2xl border border-white/10 transform hover:scale-[1.02] transition-transform duration-200 shadow-lg">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  <FiCheck className="w-5 h-5" />
                </div>
                <span className="font-medium text-lg">Unlimited Local Projects</span>
              </div>
              <div className="flex items-center gap-4 text-gray-200 bg-dark-200/80 p-4 rounded-2xl border border-white/10 transform hover:scale-[1.02] transition-transform duration-200 shadow-lg">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                  <FiCheck className="w-5 h-5" />
                </div>
                <span className="font-medium text-lg">Community Support</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center hover:bg-white/10 transition-colors">
                <div className="flex justify-center mb-2 text-primary-400">
                  <FiUsers className="w-6 h-6" />
                </div>
                <div className="text-xl font-bold text-white mb-0.5">10k+</div>
                <div className="text-xs text-gray-400">Active Devs</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center hover:bg-white/10 transition-colors">
                <div className="flex justify-center mb-2 text-accent-purple">
                  <FiCode className="w-6 h-6" />
                </div>
                <div className="text-xl font-bold text-white mb-0.5">5M+</div>
                <div className="text-xs text-gray-400">Lines Generated</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center hover:bg-white/10 transition-colors">
                <div className="flex justify-center mb-2 text-green-400">
                  <FiActivity className="w-6 h-6" />
                </div>
                <div className="text-xl font-bold text-white mb-0.5">99.9%</div>
                <div className="text-xs text-gray-400">Uptime</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary-500/10 to-accent-purple/10 border border-primary-500/20 rounded-xl p-4 backdrop-blur-md flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 shrink-0">
                <FiCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">Supported Languages</h3>
                <p className="text-xs text-gray-400 mt-0.5">Python, JavaScript, Go, Rust, C++, Java + 20 more</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 relative overflow-y-auto max-h-screen">
        {/* Mobile Background (visible only on small screens) */}
        <div className="absolute inset-0 lg:hidden">
          <img src={loginHeroBg} alt="Background" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-dark-400/90 backdrop-blur-sm"></div>
        </div>

        <div className="w-full max-w-md relative z-10 py-12 mt-10">
          <div className="text-center mb-8 lg:hidden">
            <img src={logo} alt="ByteForge AI" className="w-12 h-12 mx-auto mb-4 object-contain" />
            <h1 className="text-2xl font-bold text-white">ByteForge AI</h1>
          </div>

          <div className="bg-dark-300/50 backdrop-blur-xl border border-white/5 rounded-2xl p-10 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
              <p className="text-gray-400">Enter your details to get started.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Display Name <span className="text-gray-500">(optional)</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiUser className="text-gray-500 group-focus-within:text-primary-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full bg-dark-400/50 border border-gray-700 rounded-lg py-2.5 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className="text-gray-500 group-focus-within:text-primary-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    className={`w-full bg-dark-400/50 border rounded-lg py-2.5 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all ${errors.email ? 'border-red-500' : 'border-gray-700'}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="text-gray-500 group-focus-within:text-primary-400 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className={`w-full bg-dark-400/50 border rounded-lg py-2.5 pl-11 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all ${errors.password ? 'border-red-500' : 'border-gray-700'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Requirements */}
                <div className="mt-2 grid grid-cols-1 gap-1">
                  {passwordRequirements.map((req, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 text-xs transition-colors duration-200 ${req.test(formData.password) ? 'text-green-400' : 'text-gray-500'
                        }`}
                    >
                      {req.test(formData.password) ? (
                        <FiCheck className="w-3 h-3 flex-shrink-0" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-gray-600 flex-shrink-0"></div>
                      )}
                      <span>{req.label}</span>
                    </div>
                  ))}
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="text-gray-500 group-focus-within:text-primary-400 transition-colors" />
                  </div>
                  <input
                    type={showPasswordConfirm ? 'text' : 'password'}
                    name="passwordConfirm"
                    value={formData.passwordConfirm}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className={`w-full bg-dark-400/50 border rounded-lg py-2.5 pl-11 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all ${errors.passwordConfirm ? 'border-red-500' : 'border-gray-700'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPasswordConfirm ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.passwordConfirm && (
                  <p className="text-red-400 text-xs mt-1">{errors.passwordConfirm}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-lg hover:from-primary-500 hover:to-primary-400 focus:ring-4 focus:ring-primary-500/20 shadow-lg shadow-primary-500/20 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-gray-500 backdrop-blur-xl">Or sign up with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleOAuthLogin('google')}
                className="flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white transition-all duration-200 group"
              >
                <FaGoogle className="w-5 h-5 text-white/70 group-hover:text-red-500 transition-colors" />
                <span className="text-sm font-medium">Google</span>
              </button>
              <button
                onClick={() => handleOAuthLogin('github')}
                className="flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white transition-all duration-200 group"
              >
                <FaGithub className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                <span className="text-sm font-medium">GitHub</span>
              </button>
              <button
                onClick={() => handleOAuthLogin('apple')}
                className="flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white transition-all duration-200 group"
              >
                <FaApple className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                <span className="text-sm font-medium">Apple</span>
              </button>
              <button
                onClick={() => handleOAuthLogin('gitlab')}
                className="flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white transition-all duration-200 group"
              >
                <FaGitlab className="w-5 h-5 text-white/70 group-hover:text-orange-500 transition-colors" />
                <span className="text-sm font-medium">GitLab</span>
              </button>
            </div>

            <p className="text-center text-gray-400 mt-6 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-8 text-center lg:hidden">
            <p className="text-xs text-gray-600">
              &copy; {new Date().getFullYear()} ByteForge AI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;