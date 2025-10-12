import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bug, Server, CheckCircle, XCircle } from 'lucide-react';
import { useServerManagement } from '../hooks/useServerManagement';
import { addGardenServers } from '../scripts/addGardenServers';

/**
 * 🐛 Componente de Debug para Servidores
 * Mostra informações detalhadas sobre o carregamento
 */
const ServerDebug = () => {
  const { servers, loading, error } = useServerManagement();

  useEffect(() => {
    // Debug logging
    console.log('ServerDebug:', { servers, loading, error });
  }, [servers, loading, error]);

  const handleAddServers = async () => {
    const result = await addGardenServers();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 border-2 border-orange-500 max-w-sm z-50"
    >
      <div className="flex items-center gap-2 mb-3">
        <Bug className="w-5 h-5 text-orange-500" />
        <h3 className="font-bold text-gray-900 dark:text-white">Debug - Servidores</h3>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span className="text-gray-600 dark:text-gray-400">Status:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {loading ? '⏳ Carregando...' : '✅ Pronto'}
          </span>
        </div>

        <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span className="text-gray-600 dark:text-gray-400">Total:</span>
          <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
            {servers.length} {servers.length === 1 ? 'servidor' : 'servidores'}
          </span>
        </div>

        {error && (
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <span className="text-red-600 dark:text-red-400 text-xs">{error}</span>
          </div>
        )}

        <div className="max-h-48 overflow-y-auto space-y-1">
          {servers.map((server) => (
            <div
              key={server.id}
              className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            >
              <div className="flex items-center gap-2">
                {server.status === 'active' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {server.name}
                </span>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {server.region}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddServers}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
        >
          <Server className="w-4 h-4" />
          Adicionar Servidores Garden
        </button>
      </div>
    </motion.div>
  );
};

export default ServerDebug;
