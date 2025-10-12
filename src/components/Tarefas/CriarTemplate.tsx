import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useToast } from '../ToastProvider';
import { salvarTemplatePersonalizado, atualizarTemplatePersonalizado } from '../../data/tarefasPreDefinidas';

const CriarTemplate = ({ onClose, templateParaEditar }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'media',
    tipo: '',
    tempoEstimado: ''
  });

  useEffect(() => {
    if (templateParaEditar) {
      setFormData({
        titulo: templateParaEditar.titulo,
        descricao: templateParaEditar.descricao,
        prioridade: templateParaEditar.prioridade,
        tipo: templateParaEditar.tipo,
        tempoEstimado: templateParaEditar.tempoEstimado
      });
    }
  }, [templateParaEditar]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.titulo || !formData.descricao || !formData.tipo || !formData.tempoEstimado) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    let resultado;
    if (templateParaEditar) {
      resultado = await atualizarTemplatePersonalizado(templateParaEditar.id, formData);
      if (resultado.success) {
        showToast('Template atualizado com sucesso!', 'success');
        onClose();
      } else {
        showToast('Erro ao atualizar template', 'error');
      }
    } else {
      resultado = await salvarTemplatePersonalizado(formData);
      if (resultado) {
        showToast('Template salvo com sucesso!', 'success');
        onClose();
      } else {
        showToast('Erro ao salvar template', 'error');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {templateParaEditar ? 'Editar Modelo de Tarefa' : 'Criar Modelo de Tarefa'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Título
            </label>
            <input
              type="text"
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0]"
              placeholder="Digite o título do modelo"
            />
          </div>

          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Descrição
            </label>
            <textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] min-h-[100px]"
              placeholder="Digite a descrição do modelo. Use - para criar tópicos."
            />
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              Dica: Use - no início da linha para criar tópicos
            </p>
          </div>

          <div>
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Tipo
            </label>
            <input
              type="text"
              id="tipo"
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0]"
              placeholder="Ex: Manutenção, Inventário, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="prioridade" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Prioridade
              </label>
              <select
                id="prioridade"
                value={formData.prioridade}
                onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0]"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div>
              <label htmlFor="tempoEstimado" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Tempo Estimado
              </label>
              <input
                type="text"
                id="tempoEstimado"
                value={formData.tempoEstimado}
                onChange={(e) => setFormData({ ...formData, tempoEstimado: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0]"
                placeholder="Ex: 2h, 30min"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-full hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors font-medium"
          >
            {templateParaEditar ? 'Atualizar Modelo' : 'Salvar Modelo'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CriarTemplate;

