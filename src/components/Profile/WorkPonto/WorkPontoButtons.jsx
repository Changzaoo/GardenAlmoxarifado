import React, { memo } from 'react';
import { PlayCircle, StopCircle } from 'lucide-react';

const WorkPontoButtons = memo(({ 
  modelsLoaded, 
  pontoHoje, 
  onEntradaClick, 
  onSaidaClick 
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <button
        onClick={onEntradaClick}
        disabled={!modelsLoaded || (pontoHoje?.tipo === 'entrada' && !pontoHoje?.horasTrabalhadas)}
        className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 sm:p-6 hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3 sm:flex-col sm:gap-2">
          <PlayCircle className="w-8 h-8 sm:mx-auto flex-shrink-0" />
          <div className="text-left sm:text-center flex-1">
            <p className="font-bold text-base sm:text-lg">Registrar Entrada</p>
            <p className="text-xs sm:text-sm text-white/80">
              {pontoHoje?.tipo === 'entrada' ? 'Já registrou hoje' : 'Iniciar jornada'}
            </p>
          </div>
        </div>
      </button>

      <button
        onClick={onSaidaClick}
        disabled={!modelsLoaded || !pontoHoje || pontoHoje?.tipo === 'saida'}
        className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-4 sm:p-6 hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3 sm:flex-col sm:gap-2">
          <StopCircle className="w-8 h-8 sm:mx-auto flex-shrink-0" />
          <div className="text-left sm:text-center flex-1">
            <p className="font-bold text-base sm:text-lg">Registrar Saída</p>
            <p className="text-xs sm:text-sm text-white/80">
              {!pontoHoje ? 'Registre entrada primeiro' : pontoHoje?.tipo === 'saida' ? 'Já registrou hoje' : 'Finalizar jornada'}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
});

WorkPontoButtons.displayName = 'WorkPontoButtons';

export default WorkPontoButtons;
