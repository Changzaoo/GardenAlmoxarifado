import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import FuncionarioSelector from './FuncionarioSelector';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';

const NovaTarefa = ({ adicionarTarefa, funcionarios = [] }) => {
  const { colors, classes } = twitterThemeConfig;
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
    <div className={`bg-[#192734] border border-[#38444D] rounded-xl shadow-sm p-6`}>
      <h2 className="text-lg font-semibold text-white mb-4">Nova Tarefa</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Título
            </label>
            <input
              type="text"
              value={novaTarefa.titulo}
              onChange={(e) => setNovaTarefa(prev => ({ ...prev, titulo: e.target.value }))}
              className="w-full rounded-full bg-[#253341] border border-[#38444D] text-white placeholder-[#8899A6] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] focus:border-[#1DA1F2]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Prazo
            </label>
            <input
              type="datetime-local"
              value={novaTarefa.prazo}
              onChange={(e) => setNovaTarefa(prev => ({ ...prev, prazo: e.target.value }))}
              className="w-full rounded-full bg-[#253341] border border-[#38444D] text-white placeholder-[#8899A6] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] focus:border-[#1DA1F2]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Descrição
          </label>
          <textarea
            value={novaTarefa.descricao}
            onChange={(e) => setNovaTarefa(prev => ({ ...prev, descricao: e.target.value }))}
            className="w-full rounded-xl bg-[#253341] border border-[#38444D] text-white placeholder-[#8899A6] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] focus:border-[#1DA1F2]"
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Prioridade
            </label>
            <select
              value={novaTarefa.prioridade}
              onChange={(e) => setNovaTarefa(prev => ({ ...prev, prioridade: e.target.value }))}
              className="w-full rounded-full bg-[#253341] border border-[#38444D] text-white placeholder-[#8899A6] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] focus:border-[#1DA1F2]"
            >
              <option value="baixa">Baixa</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
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
            className="bg-[#1DA1F2] text-white rounded-full px-4 py-2 flex items-center justify-center gap-2 hover:bg-[#1a91da] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] focus:ring-offset-2 focus:ring-offset-[#15202B] disabled:opacity-50"
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
