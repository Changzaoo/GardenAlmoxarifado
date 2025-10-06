import React, { memo } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const WorkPontoHistory = memo(({ pontos }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 sm:p-4">
        <h3 className="text-white font-bold text-base sm:text-lg">Histórico de Pontos</h3>
      </div>

      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {pontos.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Nenhum ponto registrado ainda</p>
          </div>
        ) : (
          pontos.map((ponto) => (
            <div
              key={ponto.id}
              className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start gap-2 sm:gap-3">
                {ponto.photoURL && (
                  <img
                    src={ponto.photoURL}
                    alt="Foto do ponto"
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                      ponto.tipo === 'entrada' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {ponto.tipo.toUpperCase()}
                    </span>
                    {ponto.faceMatchScore && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {(parseFloat(ponto.faceMatchScore) * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                    {format(ponto.timestamp.toDate(), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  {ponto.horasTrabalhadas && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                      ⏱️ {ponto.horasTrabalhadas}h {ponto.minutosTrabalhados % 60}min
                    </p>
                  )}
                  {ponto.location && (
                    <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                      <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {ponto.location.latitude.toFixed(2)}, {ponto.location.longitude.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

WorkPontoHistory.displayName = 'WorkPontoHistory';

export default WorkPontoHistory;
