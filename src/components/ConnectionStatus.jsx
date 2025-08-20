// components/ConnectionStatus.jsx
import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from './AlmoxarifadoJardim';

const ConnectionStatus = ({ offline, pendingChanges, onSync, lastSync }) => {
  const { classes } = useTheme();
  return (
  <div className="fixed bottom-4 right-4 z-50">
  <div className={`p-3 rounded-lg shadow-lg border ${offline ? classes.statusOffline : classes.statusOnline}`}> 
  <div className="flex items-center gap-2">
          {offline ? (
            <>
              <WifiOff className={`w-4 h-4 ${classes.iconWarning}`} />
              <span className={`text-sm font-medium ${classes.textWarning}`}>Modo Offline</span>
            </>
          ) : (
            <>
              <Wifi className={`w-4 h-4 ${classes.iconSuccess}`} />
              <span className={`text-sm font-medium ${classes.textSuccess}`}>Online</span>
            </>
          )}
        </div>
        
        {pendingChanges > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <AlertCircle className={`w-4 h-4 ${classes.iconWarning}`} />
            <span className={`text-xs ${classes.textWarning}`}> 
              {pendingChanges} mudança(s) pendente(s)
            </span>
            <button
              onClick={onSync}
              className={`ml-2 px-2 py-1 rounded text-xs ${classes.buttonPrimary}`}
            >
              <RefreshCw className={`w-3 h-3 ${classes.iconPrimary}`} />
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