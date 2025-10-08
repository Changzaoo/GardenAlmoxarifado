import React from 'react';
import { Info, Calendar } from 'lucide-react';
import { DATA_INICIO_CALCULO_HORAS } from '../../utils/dataCalculoHoras';

/**
 * Banner de Aviso sobre Reset de Horas
 * Exibe um aviso informativo quando há uma data customizada para início de cálculo
 */
const BannerResetHoras = () => {
  const hoje = new Date();
  const dataInicio = new Date(DATA_INICIO_CALCULO_HORAS);

  // Só exibe se a data de início for no mês atual e não for o primeiro dia
  if (
    dataInicio.getMonth() !== hoje.getMonth() ||
    dataInicio.getFullYear() !== hoje.getFullYear() ||
    dataInicio.getDate() === 1
  ) {
    return null;
  }

  const formatarData = (data) => {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Cálculo de Horas Resetado
            </h3>
          </div>
          
          <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
            O cálculo de horas de <strong>todos os funcionários</strong> foi reiniciado a partir de{' '}
            <strong>{formatarData(dataInicio)}</strong>. Os dias anteriores deste mês não estão sendo 
            considerados no saldo atual.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BannerResetHoras;
