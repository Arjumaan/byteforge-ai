import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ConversationList from '../components/ConversationList';
import api from '../services/api';
import { FiMessageSquare, FiZap, FiDollarSign, FiPlus, FiGrid, FiArrowUpRight, FiClock } from 'react-icons/fi';

const Dashboard = () => {
  const [conversations, setConversations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalTokensUsed: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [convResponse, paymentResponse] = await Promise.all([
        api.get('/chat/conversations/'),
        api.get('/payments/history/'),
      ]);

      const convList = convResponse.data.results || convResponse.data || [];
      setConversations(convList);

      if (paymentResponse.data.success) {
        setPayments(paymentResponse.data.payments || []);
        setStats({
          totalConversations: convList.length,
          totalTokensUsed: convList.reduce((acc, c) => acc + (c.total_tokens_used || 0), 0),
          totalSpent: paymentResponse.data.summary?.total_spent || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const StatCard = ({ title, value, icon: Icon, colorClass, bgClass, subValue }) => (
    <div className="bg-white dark:bg-night-900 border border-gray-100 dark:border-night-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${bgClass}`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
        <span className="text-[10px] font-semibold text-green-500 bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-green-100 dark:border-green-500/20">
          <FiArrowUpRight className="w-2.5 h-2.5" /> 12%
        </span>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-night-950 transition-colors duration-200 font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Dashboard Overview</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              Welcome back! Here's what's happening today.
            </p>
          </div>
          <Link
            to="/chat"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-primary-600 hover:bg-black dark:hover:bg-primary-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-sm"
          >
            <FiPlus className="w-4 h-4" />
            Create New Chat
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <StatCard
            title="Total Conversations"
            value={stats.totalConversations}
            icon={FiMessageSquare}
            colorClass="text-primary-600 dark:text-primary-400"
            bgClass="bg-primary-50 dark:bg-primary-500/10"
          />
          <StatCard
            title="Tokens Used"
            value={stats.totalTokensUsed.toLocaleString()}
            icon={FiZap}
            colorClass="text-yellow-600 dark:text-yellow-400"
            bgClass="bg-yellow-50 dark:bg-yellow-500/10"
          />
          <StatCard
            title="Total Spent"
            value={`$${stats.totalSpent.toFixed(2)}`}
            icon={FiDollarSign}
            colorClass="text-green-600 dark:text-green-400"
            bgClass="bg-green-50 dark:bg-green-500/10"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Conversations */}
          <div className="lg:col-span-2 bg-white dark:bg-night-900 border border-gray-100 dark:border-night-800 rounded-xl shadow-sm p-5 transition-colors">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FiGrid className="w-4 h-4 text-gray-400 dark:text-gray-400" />
                Recent Activity
              </h2>
              <Link to="/chat" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline">
                View All
              </Link>
            </div>
            <ConversationList conversations={conversations.slice(0, 5)} loading={loading} />
          </div>

          {/* Quick Actions / Tips */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-5 text-white shadow-lg space-y-5">
            <div>
              <h3 className="text-lg font-bold mb-1.5">Upgrade to Pro</h3>
              <p className="text-primary-100 text-xs leading-relaxed mb-3">
                Unlock advanced models like GPT-4o and Claude 3 Opus for complex reasoning tasks.
              </p>
              <button className="w-full py-2 bg-white text-primary-700 font-bold rounded-lg hover:bg-primary-50 transition-colors text-xs">
                View Plans
              </button>
            </div>
            <div className="pt-5 border-t border-white/20">
              <h4 className="font-bold text-xs mb-1.5 flex items-center gap-1.5">
                <FiZap className="w-3.5 h-3.5 text-yellow-300" /> Pro Tip
              </h4>
              <p className="text-[10px] text-primary-100">
                Use <code className="bg-white/20 px-1 py-0.5 rounded text-white font-mono">Shift + Enter</code> to create a new line in the chat input without sending.
              </p>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white dark:bg-night-900 border border-gray-100 dark:border-night-800 rounded-xl shadow-sm overflow-hidden transition-colors">
          <div className="p-5 border-b border-gray-100 dark:border-night-800">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Payment History</h2>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-50 dark:bg-night-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiDollarSign className="w-5 h-5 text-gray-400 dark:text-gray-500 opacity-50" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">No transactions found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50/50 dark:bg-night-800">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">Details</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-night-800">
                  {payments.slice(0, 5).map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50/30 dark:hover:bg-night-800/50 transition-colors">
                      <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-300 font-medium">
                        <div className="flex items-center gap-2">
                          <FiClock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          {formatDate(payment.created_at)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{payment.conversation?.title || 'Token Top-up'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">+{payment.tokens_added.toLocaleString()} tokens</p>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-green-400 font-bold">
                        ${parseFloat(payment.amount).toFixed(2)}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${payment.status === 'success'
                          ? 'bg-green-50 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30'
                          : payment.status === 'pending'
                            ? 'bg-yellow-50 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30'
                            : 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30'
                          }`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;