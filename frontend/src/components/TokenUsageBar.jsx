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
    <div className="bg-white/50 dark:bg-night-900/50 backdrop-blur-sm border border-dark-100 dark:border-night-800 rounded-lg p-1.5 px-2.5 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 min-w-fit">
          <FiZap className={`w-3 h-3 ${getTextColor()}`} />
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">Usage</span>
        </div>

        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-night-800 rounded-full overflow-hidden ring-1 ring-black/5 dark:ring-white/5 min-w-[60px]">
          <div
            className={`h-full ${getColor()} transition-all duration-700 ease-out rounded-full`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center gap-2 min-w-fit">
          <span className={`text-[9px] font-black ${getTextColor()}`}>
            {percentage.toFixed(0)}%
          </span>
          {percentage >= 80 && (
            <button
              onClick={onTopUp}
              className="px-2 py-0.5 bg-gray-900 dark:bg-primary-600 text-white text-[8px] font-black uppercase tracking-tighter rounded border border-transparent hover:bg-black transition-all"
            >
              TopUp
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenUsageBar;