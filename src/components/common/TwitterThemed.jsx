import React from 'react';

export const TwitterThemedPage = ({ children, className = '' }) => (
  <div className={`min-h-screen bg-[#15202B] text-white p-4 ${className}`}>
    {children}
  </div>
);

export const TwitterCard = ({ children, className = '' }) => (
  <div className={`bg-[#192734] border border-[#38444D] rounded-2xl p-6 shadow-sm ${className}`}>
    {children}
  </div>
);

export const TwitterInput = ({ className = '', ...props }) => (
  <input
    className={`w-full bg-[#253341] border border-[#38444D] rounded-full px-4 py-2 text-white placeholder-[#8899A6] focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] ${className}`}
    {...props}
  />
);

export const TwitterSearchInput = ({ className = '', ...props }) => (
  <div className="relative">
    <svg
      className="w-5 h-5 absolute left-3 top-2.5 text-[#8899A6]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
    <input
      className={`w-full pl-10 pr-4 py-2 bg-[#253341] border border-[#38444D] rounded-full text-white placeholder-[#8899A6] focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] ${className}`}
      {...props}
    />
  </div>
);

export const TwitterButton = ({ variant = 'primary', className = '', children, ...props }) => {
  const variants = {
    primary: 'bg-[#1DA1F2] hover:bg-[#1a91da]',
    danger: 'bg-[#F4212E] hover:bg-[#dc1e29]',
    secondary: 'bg-[#38444D] hover:bg-[#465A6C]'
  };

  return (
    <button
      className={`px-4 py-2 rounded-full text-white transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const TwitterBadge = ({ variant = 'info', className = '', children }) => {
  const variants = {
    info: 'bg-[#1D9BF0] bg-opacity-10 text-[#1D9BF0]',
    success: 'bg-[#00BA7C] bg-opacity-10 text-[#00BA7C]',
    warning: 'bg-[#FFD700] bg-opacity-10 text-[#FFD700]',
    error: 'bg-[#F4212E] bg-opacity-10 text-[#F4212E]',
    neutral: 'bg-[#8899A6] bg-opacity-10 text-[#8899A6]'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const TwitterSelect = ({ className = '', children, ...props }) => (
  <select
    className={`bg-[#253341] border border-[#38444D] rounded-full px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] ${className}`}
    {...props}
  >
    {children}
  </select>
);

export const TwitterModal = ({ isOpen, onClose, children, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-[#192734] border border-[#38444D] rounded-2xl p-6 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto ${className}`}>
        {children}
      </div>
    </div>
  );
};

export const TwitterTable = ({ children, className = '' }) => (
  <div className={`bg-[#192734] border border-[#38444D] rounded-2xl overflow-hidden ${className}`}>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[#38444D]">
        {children}
      </table>
    </div>
  </div>
);

export const TwitterTableHeader = ({ children, className = '' }) => (
  <th className={`px-6 py-3 text-left text-xs font-medium text-[#8899A6] uppercase tracking-wider ${className}`}>
    {children}
  </th>
);

export const TwitterTableCell = ({ children, className = '' }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm text-white ${className}`}>
    {children}
  </td>
);
