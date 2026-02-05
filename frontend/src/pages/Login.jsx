import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheck, FiArrowRight, FiCode, FiActivity, FiUsers } from 'react-icons/fi';
import { FaGoogle, FaGithub, FaApple, FaGitlab } from 'react-icons/fa';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';
import loginHeroBg from '../assets/login_hero_bg.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/chat';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password, rememberMe);
      console.log('Login result:', result);

      if (result.success) {
        toast.success('Welcome back!');
        navigate(from, { replace: true });
      } else if (result.requires_verification) {
        toast('Please verify your email first', {
          icon: '📧',
        });
        navigate('/verify-email', { state: { email: result.email } });
      } else {
        setError(result.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Login submit error:', err);
      const msg = err.response?.data?.message || err.message || 'An error occurred. Please try again.';
      setError(msg);
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
            The Future of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-accent-purple to-primary-400 bg-[length:200%_auto] animate-gradient">Intelligence</span>
          </h1>

          <p className="text-lg text-gray-300/90 leading-relaxed mb-12 font-medium">
            Join the elite circle of developers building with the world's most advanced AI orchestration platform.
          </p>

          <div className="grid grid-cols-2 gap-6 mb-12">
            {[
              { label: 'Cloud Computing', color: 'text-blue-400' },
              { label: 'Blockchain', color: 'text-purple-400' },
              { label: 'Full Stack', color: 'text-green-400' },
              { label: 'System Design', color: 'text-orange-400' }
            ].map((skill, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className={`w-2 h-2 rounded-full bg-current ${skill.color} animate-pulse`}></div>
                <span className="text-sm font-bold text-gray-200 tracking-wide uppercase">{skill.label}</span>
              </div>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-12 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner">
            <div className="text-left">
              <div className="text-3xl font-black text-white mb-1 tracking-tighter">10K+</div>
              <div className="text-[10px] uppercase font-black text-primary-400 tracking-[0.2em]">Developers</div>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="text-left">
              <div className="text-3xl font-black text-white mb-1 tracking-tighter">5M+</div>
              <div className="text-[10px] uppercase font-black text-accent-purple tracking-[0.2em]">Tokens</div>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="text-left">
              <div className="text-3xl font-black text-white mb-1 tracking-tighter">99.9%</div>
              <div className="text-[10px] uppercase font-black text-green-400 tracking-[0.2em]">Uptime</div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form Card */}
        <div className="w-full max-w-md lg:max-w-lg animate-slideUp">
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
                <h2 className="text-3xl lg:text-4xl font-black text-white mb-3 tracking-tight">Welcome Back</h2>
                <p className="text-gray-400 font-medium">Elevate your workflow with AI.</p>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 mb-8 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 animate-shake">
                  <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-wider">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="agent@byteforge.ai"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 focus:bg-white/10 transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2 ml-1">
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em]">
                      Security Key (Password)
                    </label>
                    <Link to="/forgot-password" size="sm" className="text-[10px] uppercase font-black text-primary-400 hover:text-primary-300 tracking-[0.1em] transition-colors">
                      Recover
                    </Link>
                  </div>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiLock className="w-5 h-5 text-gray-500 group-focus-within/input:text-primary-400 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 focus:bg-white/10 transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary-400 transition-colors"
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer group/check">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border-2 border-white/10 bg-white/5 transition-all checked:border-primary-500 checked:bg-primary-500"
                      />
                      <FiCheck className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    <span className="text-xs font-bold text-gray-400 group-hover/check:text-gray-300 transition-colors tracking-wide uppercase">Persist session</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-black uppercase tracking-[0.2em] text-sm rounded-2xl hover:from-primary-500 hover:to-primary-400 focus:ring-4 focus:ring-primary-500/20 shadow-[0_8px_24px_-4px_rgba(59,130,246,0.5)] transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Authorize</span>
                      <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black text-gray-500 tracking-[0.3em]">
                  <span className="px-4 bg-dark-900/0 backdrop-blur-none">External Link</span>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { id: 'google', icon: FaGoogle, hover: 'hover:border-red-500/50 hover:text-red-500' },
                  { id: 'github', icon: FaGithub, hover: 'hover:border-white/50 hover:text-white' },
                  { id: 'apple', icon: FaApple, hover: 'hover:border-white/50 hover:text-white' },
                  { id: 'gitlab', icon: FaGitlab, hover: 'hover:border-orange-500/50 hover:text-orange-500' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleOAuthLogin(p.id)}
                    className={`flex items-center justify-center py-3.5 bg-white/5 border border-white/10 rounded-2xl text-gray-400 transition-all duration-300 ${p.hover}`}
                  >
                    <p.icon className="w-5 h-5" />
                  </button>
                ))}
              </div>

              <p className="text-center text-gray-400 mt-10 text-[11px] font-bold uppercase tracking-[0.1em]">
                New recruit?{' '}
                <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-black underline underline-offset-4 decoration-primary-500/50">
                  Initialize Account
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[10px] uppercase font-black text-gray-500 tracking-[0.4em]">
              &copy; {new Date().getFullYear()} ByteForge Protocol
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;