import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ErrorBoundary = ({ error }) => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#15202B] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#192734] rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-center mb-4">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
          Erro ao Carregar o Sistema
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
          {error || "Ocorreu um erro ao carregar o sistema. Por favor, tente novamente."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-[#1DA1F2] text-white py-2 px-4 rounded-lg hover:bg-[#1A8CD8] transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
};

export default ErrorBoundary;
