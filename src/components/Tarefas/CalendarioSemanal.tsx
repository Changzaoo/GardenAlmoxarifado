import React, { useState, useEffect } from 'react';
import { TarefaSemanal } from '../../types/tarefasSemanal';
import { TarefasSemanaisService } from '../../services/tarefasSemanaisService';

const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const CalendarioSemanal = () => {
  const [tarefasPorDia, setTarefasPorDia] = useState<Record<number, TarefaSemanal[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregarTarefas = async () => {
      try {
        setLoading(true);
        const todasTarefas: Record<number, TarefaSemanal[]> = {};
        
        // Inicializa o objeto com arrays vazios para cada dia
        diasDaSemana.forEach((_, index) => {
          todasTarefas[index] = [];
        });

        // Busca tarefas para cada dia da semana
        await Promise.all(
          diasDaSemana.map(async (_, index) => {
            const tarefasDoDia = await TarefasSemanaisService.buscarTarefasPorDia(index);
            todasTarefas[index] = tarefasDoDia;
          })
        );

        setTarefasPorDia(todasTarefas);
      } catch (err) {
        setError('Erro ao carregar tarefas');
        console.error('Erro ao carregar tarefas:', err);
      } finally {
        setLoading(false);
      }
    };

    carregarTarefas();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const renderTarefas = (dia: number) => {
    const tarefas = tarefasPorDia[dia] || [];
    
    return (
      <div className="space-y-2">
        {tarefas.map((tarefa) => (
          <div
            key={tarefa.id}
            className={`
              p-2 rounded-lg shadow-sm
              ${tarefa.prioridade === 'alta' ? 'bg-red-100' :
                tarefa.prioridade === 'media' ? 'bg-yellow-100' : 'bg-green-100'}
            `}
          >
            <h4 className="font-semibold">{tarefa.titulo}</h4>
            <p className="text-sm text-gray-600 truncate">{tarefa.descricao}</p>
            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
              <span>{tarefa.funcionariosIds.length} funcionário(s)</span>
              <span>{tarefa.status}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-7 gap-4">
        {diasDaSemana.map((dia, index) => (
          <div key={dia} className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-center">{dia}</h3>
            {renderTarefas(index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarioSemanal;