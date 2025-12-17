import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import { formatDate } from '../utils/helpers';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/dashboard');
      return;
    }
    loadDashboard();
  }, [user, navigate]);

  const loadDashboard = async () => {
    try {
      const data = await adminAPI.getDashboard();
      setStats(data);
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);
      if (error.status === 403) {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            </div>
            <button
              onClick={loadDashboard}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition duration-200"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-dark-surface rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-white mt-2">{stats?.total_users || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-dark-surface rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Conversations</p>
                <p className="text-3xl font-bold text-white mt-2">{stats?.total_conversations || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-dark-surface rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Tokens Used</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {(stats?.total_tokens_used || 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-dark-surface rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Latest Payments</h2>
          
          {!stats?.latest_payments || stats.latest_payments.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No payments yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 font-medium py-3">ID</th>
                    <th className="text-left text-gray-400 font-medium py-3">User</th>
                    <th className="text-left text-gray-400 font-medium py-3">Amount</th>
                    <th className="text-left text-gray-400 font-medium py-3">Tokens</th>
                    <th className="text-left text-gray-400 font-medium py-3">Status</th>
                    <th className="text-left text-gray-400 font-medium py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.latest_payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-700">
                      <td className="py-3 text-gray-300">#{payment.id}</td>
                      <td className="py-3 text-gray-300">{payment.user_email}</td>
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
                      <td className="py-3 text-gray-300">{formatDate(payment.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
