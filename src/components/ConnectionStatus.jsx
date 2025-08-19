// components/ConnectionStatus.jsx
import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const ConnectionStatus = ({ offline, pendingChanges, onSync, lastSync }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`p-3 rounded-lg shadow-lg border ${
        offline 
          ? 'bg-yellow-100 border-yellow-300 text-yellow-800' 
          : 'bg-green-100 border-green-300 text-green-800'
      }`}>
        <div className="flex items-center gap-2">
          {offline ? (
            <>
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">Modo Offline</span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium">Online</span>
            </>
          )}
        </div>
        
        {pendingChanges > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">
              {pendingChanges} mudança(s) pendente(s)
            </span>
            <button
              onClick={onSync}
              className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        )}
        
        {lastSync && !offline && (
          <div className="mt-1 text-xs opacity-75">
            Última sync: {new Date(lastSync).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;