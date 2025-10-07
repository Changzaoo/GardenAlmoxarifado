import React from 'react';
import { Trophy, Package, CheckCircle, Star } from 'lucide-react';

const DetalhamentoPontosTab = ({ stats }) => {
  console.log('📊 DetalhamentoPontosTab - stats recebido:', stats);
  console.log('📊 Pontos:', stats?.pontos);
  console.log('📊 Detalhes:', stats?.pontos?.detalhes);
  
  return (
    <div className="space-y-6">
      {/* Cards de Detalhamento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ferramentas Devolvidas */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform cursor-pointer"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl">
              <Package className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Ferramentas Devolvidas
            </h3>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
              {stats?.pontos?.detalhes?.ferramentas || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">pts</p>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Clique para detalhes
          </div>
        </div>

        {/* Tarefas Concluídas */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform cursor-pointer"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Tarefas Concluídas
            </h3>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
              {stats?.pontos?.detalhes?.tarefas || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">pts</p>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Clique para detalhes
          </div>
        </div>

        {/* Avaliações */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform cursor-pointer"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-xl">
              <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Avaliações
            </h3>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
              {stats?.pontos?.detalhes?.avaliacao || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">pts</p>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Clique para detalhes
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalhamentoPontosTab;
