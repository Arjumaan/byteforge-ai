import React, { useState } from 'react';
import { paymentAPI } from '../services/api';

const PaymentModal = ({ isOpen, onClose, conversation, onSuccess }) => {
  const [amount, setAmount] = useState('10.00');
  const [tokensToAdd, setTokensToAdd] = useState(10000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAmountChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setAmount(value.toFixed(2));
    // Calculate tokens: $10 = 10,000 tokens
    setTokensToAdd(Math.floor(value * 1000));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await paymentAPI.createPayment(conversation.id, parseFloat(amount), tokensToAdd);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-surface rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Token Top-Up</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
            <p className="font-semibold">Token Limit Reached!</p>
            <p className="text-sm mt-1">You've reached the {conversation?.token_limit?.toLocaleString()} token limit for this conversation.</p>
          </div>

          <div className="bg-dark-bg rounded-lg p-4 mb-4">
            <h3 className="text-white font-semibold mb-2">Current Usage</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Tokens Used:</span>
              <span className="text-white font-mono">{conversation?.total_tokens_used?.toLocaleString()} / {conversation?.token_limit?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={handleAmountChange}
                  className="w-full pl-8 pr-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Tokens to Add
              </label>
              <input
                type="text"
                value={tokensToAdd.toLocaleString()}
                readOnly
                className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-white"
              />
              <p className="text-gray-400 text-xs mt-2">Rate: $1 = 1,000 tokens</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </form>

        <p className="text-gray-500 text-xs text-center mt-4">
          This is a mock payment for demonstration purposes
        </p>
      </div>
    </div>
  );
};

export default PaymentModal;
