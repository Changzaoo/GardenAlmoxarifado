import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Map, List } from 'lucide-react';
import ServerWorldMap from '../components/ServerWorldMap';
import ServerManagement from '../components/ServerManagement';
import ServerDebug from '../components/ServerDebug';

/**
 * 🗺️ Página de Infraestrutura de Servidores
 * Combina visualização em mapa com gerenciamento completo
 */
const ServidoresPage = () => {
  const [view, setView] = useState('map'); // 'map' ou 'management'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Toggle de Visualização */}
        <div className="flex items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView('map')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              view === 'map'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Map className="w-5 h-5" />
            Visualização de Mapa
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView('management')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              view === 'management'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <List className="w-5 h-5" />
            Gerenciamento
          </motion.button>
        </div>

        {/* Conteúdo */}
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {view === 'map' ? <ServerWorldMap /> : <ServerManagement />}
        </motion.div>

        {/* Debug Component */}
        <ServerDebug />
      </div>
    </div>
  );
};

export default ServidoresPage;
