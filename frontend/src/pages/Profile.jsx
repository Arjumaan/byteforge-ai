import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiCamera, FiCheck, FiSave, FiShield } from 'react-icons/fi';
import { FaGoogle, FaGithub as FaGithubIcon, FaApple } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateProfile({ display_name: displayName });
      if (result.success) {
        setSaved(true);
        toast.success('Profile updated successfully');
        setTimeout(() => setSaved(false), 2000);
      } else {
        toast.error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'google': return <FaGoogle className="w-4 h-4" />;
      case 'github': return <FaGithubIcon className="w-4 h-4" />;
      case 'apple': return <FaApple className="w-4 h-4" />;
      default: return <FiMail className="w-4 h-4" />;
    }
  };

  const getProviderName = (provider) => {
    if (!provider) return 'Email';
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-night-950 transition-colors duration-200 font-sans">
      <Navbar />

      {/* Background Banner */}
      <div className="h-40 bg-gradient-to-r from-primary-600 to-accent-purple relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column: Quick Profile Card */}
          <div className="w-full md:w-1/3">
            <div className="bg-white dark:bg-night-900 rounded-xl shadow-lg border border-gray-100 dark:border-night-800 overflow-hidden transition-colors">
              <div className="p-5 flex flex-col items-center border-b border-gray-50 dark:border-night-800">
                <div className="w-20 h-20 rounded-full p-1 bg-white dark:bg-night-800 shadow-md -mt-14 mb-3 relative group cursor-pointer transition-colors">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center overflow-hidden">
                    {user?.display_name ? (
                      <span className="text-3xl font-bold text-white">
                        {user.display_name[0].toUpperCase()}
                      </span>
                    ) : (
                      <FiUser className="w-9 h-9 text-white" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiCamera className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center">
                  {user?.display_name || 'User'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{user?.email}</p>

                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 dark:bg-night-800 rounded-full border border-gray-100 dark:border-night-700 transition-colors">
                  {getProviderIcon(user?.provider)}
                  <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                    {getProviderName(user?.provider)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gray-50/50 dark:bg-night-800/50 transition-colors">
                <div className="flex justify-between items-center text-xs py-1.5 border-b border-gray-100/50 dark:border-night-800 last:border-0">
                  <span className="text-gray-500 dark:text-gray-400">Member Since</span>
                  <span className="font-medium text-gray-900 dark:text-gray-200">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs py-1.5 border-b border-gray-100/50 dark:border-night-800 last:border-0">
                  <span className="text-gray-500 dark:text-gray-400">Account Type</span>
                  <span className="font-medium text-gray-900 dark:text-gray-200 flex items-center gap-1">
                    {user?.is_admin ? (
                      <>
                        <FiShield className="w-3 h-3 text-primary-600" /> Admin
                      </>
                    ) : 'Standard'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Edit Settings */}
          <div className="w-full md:w-2/3 space-y-5 pb-10">
            <div className="bg-white dark:bg-night-900 rounded-xl shadow-sm border border-gray-100 dark:border-night-800 p-5 md:p-6 transition-colors">
              <div className="mb-5">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <span className="p-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg"><FiUser className="w-4 h-4" /></span>
                  Profile Settings
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 ml-8">Update your personal information and public profile.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1.5">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-white dark:bg-night-800 border border-gray-200 dark:border-night-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 focus:border-primary-500 transition-all font-medium"
                      placeholder="e.g. John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                      Email Address <span className="text-gray-400 dark:text-gray-500 font-normal normal-case ml-0.5">(Managed by provider)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full bg-gray-50 dark:bg-night-950/50 border border-gray-200 dark:border-night-800 rounded-lg px-3 py-2.5 pl-9 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed transition-colors"
                      />
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDisplayName(user?.display_name || '')}
                    className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-night-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-5 py-2 bg-gray-900 dark:bg-primary-600 hover:bg-black dark:hover:bg-primary-700 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : saved ? (
                      <>
                        <FiCheck className="w-3.5 h-3.5" />
                        Saved Changes
                      </>
                    ) : (
                      <>
                        <FiSave className="w-3.5 h-3.5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white dark:bg-night-900 rounded-xl shadow-sm border border-gray-100 dark:border-night-800 p-5 transition-colors">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <span className="p-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg"><FiShield className="w-4 h-4" /></span>
                Danger Zone
              </h3>
              <div className="flex items-center justify-between p-3.5 bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 rounded-lg transition-colors">
                <div>
                  <h4 className="font-bold text-red-900 dark:text-red-200 text-xs">Delete Account</h4>
                  <p className="text-[10px] text-red-600 dark:text-red-400/80 mt-0.5">Permanently remove your data and access.</p>
                </div>
                <button className="px-3 py-1.5 bg-white dark:bg-transparent border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;