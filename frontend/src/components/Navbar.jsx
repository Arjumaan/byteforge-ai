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
  FiMoon,
  FiSun
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
    { path: '/chat', label: 'Chat', icon: FiMessageSquare },
    { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
    { path: '/profile', label: 'Profile', icon: FiUser },
  ];

  if (isAdmin) {
    navLinks.push({ path: '/admin', label: 'Admin', icon: FiShield });
  }

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav className="bg-white dark:bg-night-950 border-b border-gray-200 dark:border-night-900 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/chat" className="flex items-center gap-2">
            <img src={logo} alt="ByteForge AI" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-purple bg-clip-text text-transparent">ByteForge AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium ${isActive(link.path)
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-night-900'
                  }`}
              >
                <link.icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Right Side: Theme Toggle & User Menu */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-night-900 rounded-lg transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button>

            <div className="h-6 w-px bg-gray-200 dark:bg-night-800 mx-1"></div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-200 leading-none">
                  {user?.display_name || user?.email?.split('@')[0]}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {user?.is_admin ? 'Admin' : 'Pro Plan'}
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-purple p-0.5">
                <div className="w-full h-full rounded-full bg-white dark:bg-night-900 flex items-center justify-center overflow-hidden">
                  <span className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary-500 to-accent-purple">
                    {user?.display_name?.[0] || user?.email?.[0]?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
              title="Logout"
            >
              <FiLogOut className="w-5 h-5" />
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