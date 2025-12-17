import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, paymentAPI } from '../services/api';
import { formatDate } from '../utils/helpers';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [payments, setPayments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    try {
      const data = await paymentAPI.getPaymentHistory();
      setPayments(data);
    } catch (error) {
      console.error('Failed to load payment history:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await authAPI.updateProfile({ display_name: displayName });
      updateUser(response.user);
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-surface border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6">
          {/* Profile Information */}
          <div className="bg-dark-surface rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {message && (
                <div className={`px-4 py-3 rounded ${
                  message.includes('success') 
                    ? 'bg-green-500 bg-opacity-10 border border-green-500 text-green-500'
                    : 'bg-red-500 bg-opacity-10 border border-red-500 text-red-500'
                }`}>
                  {message}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your display name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Provider
                </label>
                <input
                  type="text"
                  value={user?.provider}
                  disabled
                  className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed capitalize"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Member Since
                </label>
                <input
                  type="text"
                  value={formatDate(user?.created_at)}
                  disabled
                  className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>

          {/* Payment History */}
          <div className="bg-dark-surface rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Payment History</h2>
            
            {payments.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No payment history yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left text-gray-400 font-medium py-3">Date</th>
                      <th className="text-left text-gray-400 font-medium py-3">Amount</th>
                      <th className="text-left text-gray-400 font-medium py-3">Tokens</th>
                      <th className="text-left text-gray-400 font-medium py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-700">
                        <td className="py-3 text-gray-300">{formatDate(payment.created_at)}</td>
                        <td className="py-3 text-gray-300">${payment.amount}</td>
                        <td className="py-3 text-gray-300">{payment.tokens_added.toLocaleString()}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            payment.status === 'success' 
                              ? 'bg-green-500 bg-opacity-20 text-green-500'
                              : payment.status === 'pending'
                              ? 'bg-yellow-500 bg-opacity-20 text-yellow-500'
                              : 'bg-red-500 bg-opacity-20 text-red-500'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
