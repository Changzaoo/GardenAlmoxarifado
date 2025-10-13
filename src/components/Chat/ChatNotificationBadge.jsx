import React from 'react';
import { useMessageNotifications } from './MessageNotificationContext';

const ChatNotificationBadge = () => {
  const { totalUnread } = useMessageNotifications();

  if (totalUnread === 0) return null;

  return (
    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-lg animate-pulse">
      {totalUnread > 99 ? '99+' : totalUnread}
    </div>
  );
};

export default ChatNotificationBadge;
