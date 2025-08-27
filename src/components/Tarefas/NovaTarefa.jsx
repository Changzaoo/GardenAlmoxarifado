import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import FuncionarioSelector from './FuncionarioSelector';

const NovaTarefa = ({ adicionarTarefa, funcionarios = [] }) => {
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState([]);
  const [novaTarefa, setNovaTarefa] = useState({
    titulo: '',
    descricao: '',
    prazo: '',
    prioridade: 'normal',
    responsaveis: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!novaTarefa.titulo || !novaTarefa.descricao) return;

    try {
      if (funcionariosSelecionados.length === 0) {
        throw new Error('Selecione pelo menos um responsável pela tarefa');
      }

      const sucesso = await adicionarTarefa({
        ...novaTarefa,
        responsaveis: funcionariosSelecionados
      });

      if (sucesso) {
        setNovaTarefa({
          titulo: '',
          descricao: '',
          prazo: '',
          prioridade: 'normal',
          responsaveis: []
        });
        setFuncionariosSelecionados([]);
      }
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold dark:text-white mb-4">Nova Tarefa</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título
            </label>
            <input
              type="text"
              value={novaTarefa.titulo}
              onChange={(e) => setNovaTarefa(prev => ({ ...prev, titulo: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prazo
            </label>
            <input
              type="datetime-local"
              value={novaTarefa.prazo}
              onChange={(e) => setNovaTarefa(prev => ({ ...prev, prazo: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            value={novaTarefa.descricao}
            onChange={(e) => setNovaTarefa(prev => ({ ...prev, descricao: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prioridade
            </label>
            <select
              value={novaTarefa.prioridade}
              onChange={(e) => setNovaTarefa(prev => ({ ...prev, prioridade: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="baixa">Baixa</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsáveis
            </label>
            <FuncionarioSelector
              funcionarios={funcionarios}
              onSelecionarFuncionarios={(funcionariosIds) => {
                setFuncionariosSelecionados(funcionariosIds);
                setNovaTarefa(prev => ({
                  ...prev,
                  responsaveis: funcionariosIds
                }));
              }}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            Criar Tarefa
          </button>
        </div>
      </form>
    </div>
  );
};

export default NovaTarefa;
