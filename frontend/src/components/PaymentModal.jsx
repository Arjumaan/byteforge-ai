import React, { useState } from 'react';
import { FiX, FiDollarSign, FiZap, FiCheck } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, conversationId, onSuccess }) => {
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const tokenPackages = [
    { amount: 5, tokens: 5000 },
    { amount: 10, tokens: 10000 },
    { amount: 25, tokens: 25000 },
    { amount: 50, tokens: 50000 },
  ];

  const handlePayment = async () => {
    if (!conversationId) {
      toast.error('No conversation selected');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/payments/create/', {
        conversation_id: conversationId,
        amount: amount,
      });

      if (response.data.success) {
        setSuccess(true);
        toast.success('Payment successful! Tokens added.');

        setTimeout(() => {
          onSuccess?.(response.data);
          onClose();
          setSuccess(false);
        }, 2000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-dark-900/60 dark:bg-black/80 backdrop-blur-sm transition-colors duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-dark-100 rounded-3xl border border-dark-100/50 dark:border-dark-300 w-full max-w-md shadow-2xl overflow-hidden transform transition-all duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-100/50 dark:border-dark-300 bg-dark-50/50 dark:bg-dark-200/50">
          <h2 className="text-xl font-bold text-dark-900 dark:text-gray-100 tracking-tight">Top Up Tokens</h2>
          <button
            onClick={onClose}
            className="p-2 text-dark-400 dark:text-gray-400 hover:text-dark-900 dark:hover:text-white hover:bg-dark-100 dark:hover:bg-dark-300 rounded-full transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100 dark:border-green-500/20">
                <FiCheck className="w-10 h-10 text-green-500 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">Payment Successful!</h3>
              <p className="text-dark-500 dark:text-gray-400">
                <span className="font-semibold text-dark-900 dark:text-gray-100">{(amount * 1000).toLocaleString()} tokens</span> have been automatically added based on your selection.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                <div className="p-1.5 bg-white dark:bg-dark-200 rounded-full text-primary-600 dark:text-primary-400 shadow-sm mt-0.5">
                  <FiZap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary-900 dark:text-primary-200 text-sm">Token Limit Reached</h4>
                  <p className="text-xs text-primary-700 dark:text-primary-300/80 mt-1 leading-relaxed">
                    To maintain quality service, please top up your account to continue utilizing the AI models.
                  </p>
                </div>
              </div>

              {/* Package Selection */}
              <label className="block text-xs font-bold text-dark-400 dark:text-gray-500 uppercase tracking-wider mb-3">Select Package</label>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {tokenPackages.map((pkg) => (
                  <button
                    key={pkg.amount}
                    onClick={() => setAmount(pkg.amount)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 relative overflow-hidden ${amount === pkg.amount
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/20 shadow-md ring-1 ring-primary-200 dark:ring-primary-500/30'
                      : 'border-dark-100 dark:border-dark-300 bg-white dark:bg-dark-200 hover:border-primary-300 dark:hover:border-primary-500 hover:shadow-sm'
                      }`}
                  >
                    <div className="flex items-center gap-1 text-2xl font-bold text-dark-900 dark:text-white mb-1">
                      <span className="text-lg text-dark-400 dark:text-gray-500">$</span>{pkg.amount}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-dark-500 dark:text-gray-400">
                      <div className={`w-1.5 h-1.5 rounded-full ${amount === pkg.amount ? 'bg-primary-500' : 'bg-dark-300 dark:bg-gray-600'}`}></div>
                      {pkg.tokens.toLocaleString()} tokens
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="mb-8">
                <label className="block text-xs font-bold text-dark-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Custom Amount
                </label>
                <div className="relative group">
                  <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 dark:text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    className="w-full bg-dark-50 dark:bg-dark-200 border border-dark-200 dark:border-dark-300 rounded-xl py-3 pl-10 pr-4 text-dark-900 dark:text-white font-medium placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-dark-400 dark:text-gray-500 font-medium bg-white dark:bg-dark-300 px-2 py-1 rounded-md border border-dark-100 dark:border-dark-400 shadow-sm">
                    {(amount * 1000).toLocaleString()} tokens
                  </div>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full py-4 bg-dark-900 dark:bg-primary-600 text-white font-bold rounded-xl hover:bg-black dark:hover:bg-primary-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-5 h-5" />
                    Pay ${amount} USD
                  </>
                )}
              </button>

              <p className="text-[10px] text-dark-400 dark:text-gray-500 text-center mt-4 flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Secure mock payment gateway. No real charges.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;