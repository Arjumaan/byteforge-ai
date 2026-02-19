import React from 'react';
import { FiCheck, FiX, FiAlertCircle, FiInfo } from 'react-icons/fi';

const Toast = ({ type = 'info', message, onClose }) => {
  const icons = {
    success: FiCheck,
    error: FiX,
    warning: FiAlertCircle,
    info: FiInfo,
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  const Icon = icons[type] || icons.info;
  const bgColor = colors[type] || colors.info;

  return (
    <div className="flex items-center gap-3 bg-dark-200 border border-white/10 rounded-lg p-4 shadow-lg min-w-[300px]">
      <div className={`w-8 h-8 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="flex-1 text-white text-sm">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white transition-colors"
        >
          <FiX className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Toast;