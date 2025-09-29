import React, { useState } from 'react';
import { TarefaSemanal } from '../../types/tarefasSemanal';
import { TarefasSemanaisService } from '../../services/tarefasSemanaisService';

interface CriarTarefaRecorrenteProps {
  onTarefaCriada?: () => void;
}

const diasDaSemana = [
  { id: 0, nome: 'Domingo' },
  { id: 1, nome: 'Segunda' },
  { id: 2, nome: 'Terça' },
  { id: 3, nome: 'Quarta' },
  { id: 4, nome: 'Quinta' },
  { id: 5, nome: 'Sexta' },
  { id: 6, nome: 'Sábado' },
];

const CriarTarefaRecorrente: React.FC<CriarTarefaRecorrenteProps> = ({ onTarefaCriada }) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<'baixa' | 'media' | 'alta'>('media');
  const [diasSelecionados, setDiasSelecionados] = useState<number[]>([]);
  const [frequencia, setFrequencia] = useState<'semanal' | 'mensal'>('semanal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (diasSelecionados.length === 0) {
      setError('Selecione pelo menos um dia da semana');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const novaTarefa: Omit<TarefaSemanal, 'id' | 'criadaEm' | 'ultimaAtualizacao'> = {
        titulo,
        descricao,
        diasDaSemana: diasSelecionados,
        funcionariosIds: [], // Será preenchido posteriormente
        prioridade,
        status: 'pendente',
        frequencia,
      };

      await TarefasSemanaisService.criarTarefa(novaTarefa);
      
      // Limpa o formulário
      setTitulo('');
      setDescricao('');
      setPrioridade('media');
      setDiasSelecionados([]);
      setFrequencia('semanal');
      
      if (onTarefaCriada) {
        onTarefaCriada();
      }
    } catch (err) {
      setError('Erro ao criar tarefa');
      console.error('Erro ao criar tarefa:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDia = (diaId: number) => {
    setDiasSelecionados(dias => {
      if (dias.includes(diaId)) {
        return dias.filter(d => d !== diaId);
      }
      return [...dias, diaId];
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      <div>
        <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">
          Título
        </label>
        <input
          type="text"
          id="titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">
          Descrição
        </label>
        <textarea
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Dias da Semana
        </label>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {diasDaSemana.map((dia) => (
            <button
              key={dia.id}
              type="button"
              onClick={() => toggleDia(dia.id)}
              className={`
                py-2 px-4 rounded-md text-sm font-medium
                ${
                  diasSelecionados.includes(dia.id)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {dia.nome}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Prioridade
        </label>
        <select
          value={prioridade}
          onChange={(e) => setPrioridade(e.target.value as 'baixa' | 'media' | 'alta')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Frequência
        </label>
        <select
          value={frequencia}
          onChange={(e) => setFrequencia(e.target.value as 'semanal' | 'mensal')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="semanal">Semanal</option>
          <option value="mensal">Mensal</option>
        </select>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className={`
            py-2 px-4 rounded-md text-white font-medium
            ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }
          `}
        >
          {loading ? 'Criando...' : 'Criar Tarefa'}
        </button>
      </div>
    </form>
  );
};

export default CriarTarefaRecorrente;