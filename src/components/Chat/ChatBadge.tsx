import React from 'react';

export const ChatBadge = ({ count }) => {
  if (!count || count <= 0) return null;

  return (
    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-gray-900 dark:text-white bg-red-500 rounded-full">
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default ChatBadge;

