import React from 'react';
import { FiZap } from 'react-icons/fi';

const TokenUsageBar = ({ used, limit, onTopUp }) => {
  const percentage = Math.min(100, (used / limit) * 100);

  const getColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-gradient-to-r from-primary-400 to-primary-600';
  };

  const getTextColor = () => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-primary-600 dark:text-primary-400';
  };

  const getBgColor = () => {
    if (percentage >= 90) return 'bg-red-50 dark:bg-red-500/10';
    if (percentage >= 70) return 'bg-yellow-50 dark:bg-yellow-500/10';
    return 'bg-primary-50 dark:bg-primary-500/10';
  };

  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  return (
    <div className="bg-white dark:bg-night-900 border border-gray-100 dark:border-night-800 rounded-2xl p-4 shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-full ${getBgColor()}`}>
            <FiZap className={`w-3.5 h-3.5 ${getTextColor()}`} />
          </div>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Token Usage</span>
        </div>
        <span className={`text-xs font-bold ${getTextColor()}`}>
          {percentage.toFixed(1)}%
        </span>
      </div>

      <div className="h-2.5 bg-gray-100 dark:bg-night-800 rounded-full overflow-hidden mb-3 ring-1 ring-black/5 dark:ring-white/5">
        <div
          className={`h-full ${getColor()} transition-all duration-700 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
        <span>{formatNumber(used)} Used</span>
        <span>{formatNumber(limit - used)} Left</span>
      </div>

      {percentage >= 80 && (
        <button
          onClick={onTopUp}
          className="mt-3 w-full py-2 bg-gray-900 dark:bg-primary-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-black dark:hover:bg-primary-700 transition-all shadow-md hover:shadow-lg transform active:scale-95"
        >
          Add More Tokens
        </button>
      )}
    </div>
  );
};

export default TokenUsageBar;