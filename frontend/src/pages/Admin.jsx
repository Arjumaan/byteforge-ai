import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { FiUsers, FiMessageSquare, FiZap, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Admin = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    total_conversations: 0,
    total_tokens_used: 0,
  });
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const response = await api.get('/auth/admin/stats/');
      if (response.data.success) {
        setStats(response.data.stats);
        setPayments(response.data.latest_payments || []);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Admin access required');
      } else {
        toast.error('Failed to fetch admin data');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-300">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-300">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-0.5 text-sm">Platform overview and management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <FiUsers className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Users</p>
                <p className="text-xl font-bold text-white">{stats.total_users}</p>
              </div>
            </div>
          </div>

          <div className="card px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <FiMessageSquare className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Conversations</p>
                <p className="text-xl font-bold text-white">{stats.total_conversations}</p>
              </div>
            </div>
          </div>

          <div className="card px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <FiZap className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Tokens Used</p>
                <p className="text-xl font-bold text-white">{stats.total_tokens_used.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="card px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <FiDollarSign className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Payments</p>
                <p className="text-xl font-bold text-white">{payments.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Payments */}
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Latest Payments</h2>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiDollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No payments yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Conversation</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tokens</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 px-4 text-sm text-gray-300">#{payment.id}</td>
                      <td className="py-3 px-4 text-sm text-white">{payment.user_email}</td>
                      <td className="py-3 px-4 text-sm text-gray-300">{payment.conversation_title || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-gray-300">+{payment.tokens_added.toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-white font-medium">${parseFloat(payment.amount).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'success'
                            ? 'bg-green-500/20 text-green-400'
                            : payment.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">{formatDate(payment.created_at)}</td>
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

export default Admin;