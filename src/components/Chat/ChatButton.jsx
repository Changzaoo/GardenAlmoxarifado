import React from 'react';
import { MessageCircle, X } from 'lucide-react';

const ChatButton = ({ isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed right-6 bottom-6 p-4 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 z-[9999] 
        ${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-[#1D9BF0] hover:bg-[#1a8cd8]'}`}
    >
      {isOpen ? (
        <X className="w-6 h-6 text-white" />
      ) : (
        <MessageCircle className="w-6 h-6 text-white" />
      )}
    </button>
  );
};

export default ChatButton;
