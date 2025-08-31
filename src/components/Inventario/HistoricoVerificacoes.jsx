import React from 'react';
import { X } from 'lucide-react';

const HistoricoVerificacoes = ({ verificacoes, onClose }) => {
  // Agrupa as verificações por mês
  const verificacoesPorMes = verificacoes.reduce((acc, verificacao) => {
    const mes = verificacao.mes;
    if (!acc[mes]) {
      acc[mes] = {
        data: verificacao.dataVerificacao,
        responsavel: verificacao.responsavel,
        itens: Object.entries(verificacao.itens).length,
        diferencas: Object.entries(verificacao.itens).filter(([_, item]) => item.quantidade !== item.esperado).length
      };
    }
    return acc;
  }, {});

  // Ordena os meses do mais recente para o mais antigo
  const mesesOrdenados = Object.keys(verificacoesPorMes).sort().reverse();

  // Formata o mês para exibição
  const formatarMes = (mes) => {
    const [ano, mesNum] = mes.split('-');
    const data = new Date(ano, parseInt(mesNum) - 1);
    return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Histórico de Verificações
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {mesesOrdenados.length > 0 ? (
            mesesOrdenados.map(mes => {
              const verificacao = verificacoesPorMes[mes];
              return (
                <div
                  key={mes}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {formatarMes(mes)}
                    </h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Por: {verificacao.responsavel}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-300">
                        Total de itens:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {verificacao.itens}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-300">
                        Itens com diferença:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {verificacao.diferencas}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">
              Nenhuma verificação encontrada.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoricoVerificacoes;
