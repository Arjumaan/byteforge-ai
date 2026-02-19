import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  FiMessageSquare,
  FiGrid,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiShield,
  FiCpu,
  FiMoon,
  FiSun,
  FiDatabase
} from 'react-icons/fi';
import logo from '../assets/logo.png';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/tech-arsenal', label: 'Tech Arsenal', icon: FiCpu },
    { path: '/chat', label: 'Chat', icon: FiMessageSquare },
    { path: '/knowledge', label: 'Knowledge', icon: FiDatabase },
    { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
    { path: '/profile', label: 'Profile', icon: FiUser },
  ];

  if (isAdmin) {
    navLinks.push({ path: '/admin', label: 'Admin', icon: FiShield });
  }

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav className="bg-white dark:bg-night-950 border-b border-gray-100 dark:border-night-900 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/chat" className="flex items-center gap-3 min-w-fit">
            <img src={logo} alt="ByteForge AI" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-black bg-gradient-to-r from-primary-600 to-accent-purple bg-clip-text text-transparent tracking-tighter">ByteForge</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all text-[11px] font-bold ${isActive(link.path)
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-primary-600 hover:bg-gray-50'
                  }`}
              >
                <link.icon className="w-3 h-3" />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-1 text-gray-400 hover:text-primary-600 rounded transition-colors"
            >
              {theme === 'dark' ? <FiSun className="w-3.5 h-3.5" /> : <FiMoon className="w-3.5 h-3.5" />}
            </button>

            <div className="h-4 w-px bg-gray-200 dark:bg-night-800"></div>

            <div className="flex items-center gap-1.5">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-900 dark:text-gray-200 leading-none truncate max-w-[80px]">
                  {user?.display_name || user?.email?.split('@')[0]}
                </span>
                <span className="text-[8px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter">
                  {user?.is_admin ? 'Admin' : 'Pro'}
                </span>
              </div>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-purple p-0.5">
                <div className="w-full h-full rounded-full bg-white dark:bg-night-900 flex items-center justify-center overflow-hidden">
                  <span className="text-[9px] font-black text-transparent bg-clip-text bg-gradient-to-br from-primary-500 to-accent-purple">
                    {user?.display_name?.[0] || user?.email?.[0]?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
            >
              <FiLogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-4 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400"
            >
              {theme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-night-900 rounded-lg"
            >
              {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-night-950 border-t border-gray-100 dark:border-night-900">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive(link.path)
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-night-900'
                  }`}
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
            >
              <FiLogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;