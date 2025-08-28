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

      // Certifica que responsáveis é um array de IDs
      const responsaveisIds = funcionariosSelecionados.map(f => f.id || f);

      const sucesso = await adicionarTarefa({
        ...novaTarefa,
        responsaveis: responsaveisIds
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
    <div className={`${classes.card} p-6`}>
      <h2 className={`text-lg font-semibold ${colors.text} mb-4`}>Nova Tarefa</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              Título
            </label>
            <input
              type="text"
              value={novaTarefa.titulo}
              onChange={(e) => setNovaTarefa(prev => ({ ...prev, titulo: e.target.value }))}
              className={classes.input}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              Prazo
            </label>
            <input
              type="datetime-local"
              value={novaTarefa.prazo}
              onChange={(e) => setNovaTarefa(prev => ({ ...prev, prazo: e.target.value }))}
              className={classes.input}
            />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium ${colors.text} mb-2`}>
            Descrição
          </label>
          <textarea
            value={novaTarefa.descricao}
            onChange={(e) => setNovaTarefa(prev => ({ ...prev, descricao: e.target.value }))}
            className={classes.textarea}
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              Prioridade
            </label>
            <select
              value={novaTarefa.prioridade}
              onChange={(e) => setNovaTarefa(prev => ({ ...prev, prioridade: e.target.value }))}
              className="w-full bg-[#253341] border border-[#38444D] text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors appearance-none"
            >
              <option value="baixa" className="bg-[#192734]">Baixa</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
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

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1D9BF0] hover:bg-[#1A8CD8] rounded-lg transition-colors"
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
