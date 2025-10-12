import React from 'react';
import { PlayCircle } from 'lucide-react';

const AdminTestBotButton = ({ onClick, isRunning }) => {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-6 right-20 z-50
        flex items-center justify-center
        w-12 h-12 rounded-full
        bg-[#1D9BF0] hover:bg-[#1A8CD8]
        transition-all duration-200
        shadow-lg
        ${isRunning ? 'animate-pulse' : ''}
      `}
    >
      <PlayCircle className="w-6 h-6 text-white" />
      {isRunning && (
        <span className="absolute top-0 right-0 w-3 h-3">
          <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500" />
        </span>
      )}
    </button>
  );
};

export default AdminTestBotButton;
