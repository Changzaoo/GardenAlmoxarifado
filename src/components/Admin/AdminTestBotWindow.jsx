import React from 'react';
import { XCircle, CheckCircle } from 'lucide-react';

const AdminTestBotWindow = ({ isOpen, onClose, isRunning, currentTest, progress, testResults }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-20 z-50 w-96 rounded-lg overflow-hidden shadow-xl border border-[#38444D] bg-[#15202B]">
      {/* Header */}
      <div className="bg-[#1D9BF0] p-4 flex justify-between items-center">
        <h3 className="text-white font-medium">Admin Test Bot</h3>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {isRunning && (
          <>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-[#38444D] rounded-full h-2">
                <div
                  className="bg-[#1D9BF0] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="text-sm text-gray-400 mb-4">
              Executando: {currentTest}
            </div>
          </>
        )}

        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {testResults.map((result, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-[#192734] border border-[#38444D]"
            >
              <div className="flex items-start space-x-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-medium text-white">{result.name}</div>
                  <div className="text-sm text-gray-400">{result.message}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminTestBotWindow;
