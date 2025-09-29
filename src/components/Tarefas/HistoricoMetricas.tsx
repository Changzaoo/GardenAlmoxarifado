import React, { useState, useEffect } from 'react';
import { TarefaSemanal, ExecucaoTarefa } from '../../types/tarefasSemanal';
import { TarefasSemanaisService } from '../../services/tarefasSemanaisService';

interface HistoricoMetricasProps {
  tarefaId?: string; // Se não fornecido, mostra métricas gerais
}

interface Metricas {
  totalTarefas: number;
  tarefasConcluidas: number;
  mediaConclusao: number;
  taxaCompletude: number;
}

const HistoricoMetricas: React.FC<HistoricoMetricasProps> = ({ tarefaId }) => {
  const [execucoes, setExecucoes] = useState<ExecucaoTarefa[]>([]);
  const [metricas, setMetricas] = useState<Metricas>({
    totalTarefas: 0,
    tarefasConcluidas: 0,
    mediaConclusao: 0,
    taxaCompletude: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    carregarHistorico();
  }, [tarefaId]);

  const carregarHistorico = async () => {
    try {
      setLoading(true);
      let historicoData: ExecucaoTarefa[];
      
      if (tarefaId) {
        // Carrega histórico específico da tarefa
        historicoData = await TarefasSemanaisService.buscarHistoricoTarefa(tarefaId);
      } else {
        // Carrega histórico geral (implemente conforme necessário)
        historicoData = await fetch('/api/execucoes').then(res => res.json());
      }

      setExecucoes(historicoData);
      calcularMetricas(historicoData);
    } catch (err) {
      setError('Erro ao carregar histórico');
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setLoading(false);
    }
  };

  const calcularMetricas = (historicoData: ExecucaoTarefa[]) => {
    const total = historicoData.length;
    const concluidas = historicoData.filter(ex => ex.status === 'concluida').length;
    
    setMetricas({
      totalTarefas: total,
      tarefasConcluidas: concluidas,
      mediaConclusao: total > 0 ? (concluidas / total) * 100 : 0,
      taxaCompletude: total > 0 ? (concluidas / total) * 100 : 0,
    });
  };

  const renderGrafico = () => {
    return (
      <div className="h-10 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500"
          style={{ width: `${metricas.taxaCompletude}%` }}
        ></div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total de Tarefas</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-700">
            {metricas.totalTarefas}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Tarefas Concluídas</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            {metricas.tarefasConcluidas}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Média de Conclusão</h3>
          <p className="mt-2 text-3xl font-semibold text-blue-600">
            {metricas.mediaConclusao.toFixed(1)}%
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Taxa de Completude</h3>
          <div className="mt-2">
            {renderGrafico()}
            <p className="mt-1 text-sm text-gray-600">
              {metricas.taxaCompletude.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900">Histórico de Execuções</h3>
          
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Funcionário
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {execucoes.map((execucao) => (
                  <tr key={execucao.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(execucao.dataExecucao).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {execucao.funcionarioId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          execucao.status === 'concluida'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {execucao.status === 'concluida' ? 'Concluída' : 'Não Concluída'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {execucao.observacoes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricoMetricas;