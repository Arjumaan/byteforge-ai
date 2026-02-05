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
        if (result.requires_verification) {
          toast.success('Please check your email for verification code!');
          navigate('/verify-email', { state: { email: result.email } });
        } else {
          toast.success('Account created successfully!');
          navigate('/chat');
        }
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
    <div className="min-h-screen relative flex items-center justify-center p-4 md:p-8 lg:p-12 overflow-hidden select-none">
      {/* Immersive Background Layer */}
      <div className="absolute inset-0 z-0">
        <img
          src={loginHeroBg}
          alt="Background"
          className="w-full h-full object-cover scale-105 animate-pulse-slow"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-dark-950/95 via-dark-900/80 to-primary-900/40"></div>
        <div className="absolute inset-0 backdrop-blur-[2px]"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-7xl flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">

        {/* Left Side: Hero Brand Content */}
        <div className="hidden lg:flex flex-col flex-1 max-w-xl text-left animate-slideDown">
          <div className="flex items-center gap-4 mb-10 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-2xl shadow-primary-500/40 group-hover:rotate-6 transition-transform duration-500">
              <img src={logo} alt="ByteForge" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-3xl font-black text-white tracking-tighter uppercase italic">ByteForge AI</span>
          </div>

          <h1 className="text-5xl xl:text-7xl font-black text-white leading-[1.1] mb-8 tracking-tight">
            Join the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-accent-purple to-primary-400 bg-[length:200%_auto] animate-gradient">Evolution</span>
          </h1>

          <p className="text-lg text-gray-300/90 leading-relaxed mb-12 font-medium">
            Create your account today and start building smarter, faster, and more efficient applications with ByteForge AI.
          </p>

          <div className="grid grid-cols-1 gap-6 mb-12">
            {[
              { label: 'Free Access to GPT-4 & Claude 3', color: 'bg-green-500/10 text-green-400', icon: FiCheck },
              { label: 'Unlimited Local Projects', color: 'bg-blue-500/10 text-blue-400', icon: FiCheck },
              { label: 'Community Support', color: 'bg-purple-500/10 text-purple-400', icon: FiCheck }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md group hover:bg-white/10 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${feature.color}`}>
                  <feature.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-gray-200 tracking-wide uppercase">{feature.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-12 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-500/20 flex items-center justify-center text-primary-400">
                <FiUsers className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white tracking-tighter">10K+</div>
                <div className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em]">Active Devs</div>
              </div>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-purple/20 flex items-center justify-center text-accent-purple">
                <FiCode className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white tracking-tighter">5M+</div>
                <div className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em]">Lines</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form Card */}
        <div className="w-full max-w-lg animate-slideUp overflow-y-auto max-h-[90vh] custom-scrollbar">
          <div className="bg-dark-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 lg:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative overflow-hidden group">

            {/* Background Glows */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary-500/30 transition-colors"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent-purple/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-accent-purple/30 transition-colors"></div>

            <div className="relative z-10">
              <div className="mb-10 lg:hidden text-center">
                <img src={logo} alt="Logo" className="w-12 h-12 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">ByteForge</h2>
              </div>

              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl lg:text-4xl font-black text-white mb-3 tracking-tight">Create Account</h2>
                <p className="text-gray-400 font-medium">Enter your details to get started.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-2 tracking-[0.2em] ml-1">
                    Display Name (Optional)
                  </label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiUser className="w-5 h-5 text-gray-500 group-focus-within/input:text-primary-400 transition-colors" />
                    </div>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 focus:bg-white/10 transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-2 tracking-[0.2em] ml-1">
                    Intelligence ID (Email)
                  </label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiMail className="w-5 h-5 text-gray-500 group-focus-within/input:text-primary-400 transition-colors" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="agent@byteforge.ai"
                      required
                      className={`w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 focus:bg-white/10 transition-all duration-300 ${errors.email ? 'border-red-500/50 bg-red-500/5' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 uppercase transition-all animate-shake">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-2 tracking-[0.2em] ml-1">
                    Security Key (Password)
                  </label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiLock className="w-5 h-5 text-gray-500 group-focus-within/input:text-primary-400 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className={`w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 focus:bg-white/10 transition-all duration-300 ${errors.password ? 'border-red-500/50 bg-red-500/5' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary-400 transition-colors"
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                  {/* Password requirements */}
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 ml-1">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-wider transition-colors ${req.test(formData.password) ? 'text-green-400' : 'text-gray-600'}`}>
                        {req.test(formData.password) ? <FiCheck className="w-2.5 h-2.5" /> : <div className="w-1 h-1 rounded-full bg-current" />}
                        <span>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-2 tracking-[0.2em] ml-1">
                    Confirm Key
                  </label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiLock className="w-5 h-5 text-gray-500 group-focus-within/input:text-primary-400 transition-colors" />
                    </div>
                    <input
                      type={showPasswordConfirm ? 'text' : 'password'}
                      name="passwordConfirm"
                      value={formData.passwordConfirm}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className={`w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 focus:bg-white/10 transition-all duration-300 ${errors.passwordConfirm ? 'border-red-500/50 bg-red-500/5' : ''}`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-black uppercase tracking-[0.2em] text-sm rounded-2xl hover:from-primary-500 hover:to-primary-400 focus:ring-4 focus:ring-primary-500/20 shadow-[0_8px_24px_-4px_rgba(59,130,246,0.5)] transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Initialize Protocol</span>
                      <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black text-gray-600 tracking-[0.3em]">
                  <span className="px-4">Cross-Login</span>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { id: 'google', icon: FaGoogle, hover: 'hover:text-red-500 hover:border-red-500/50' },
                  { id: 'github', icon: FaGithub, hover: 'hover:text-white hover:border-white/50' },
                  { id: 'apple', icon: FaApple, hover: 'hover:text-white hover:border-white/50' },
                  { id: 'gitlab', icon: FaGitlab, hover: 'hover:text-orange-500 hover:border-orange-500/50' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleOAuthLogin(p.id)}
                    className={`flex items-center justify-center py-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 transition-all duration-300 ${p.hover}`}
                  >
                    <p.icon className="w-5 h-5" />
                  </button>
                ))}
              </div>

              <p className="text-center text-gray-400 mt-8 text-[11px] font-bold uppercase tracking-[0.1em]">
                Existing operative?{' '}
                <Link to="/login" className="text-primary-400 hover:text-primary-300 font-black underline underline-offset-4 decoration-primary-500/50">
                  Access Portal
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8 text-center pb-8">
            <p className="text-[10px] uppercase font-black text-gray-500 tracking-[0.4em]">
              &copy; {new Date().getFullYear()} ByteForge Protocol
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;