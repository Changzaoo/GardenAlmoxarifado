import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { X, ListChecks } from 'lucide-react';
import { useToast } from '../ToastProvider';
import SeletorTarefaPredefinida from './SeletorTarefaPredefinida';

const CriarTarefa = ({ onClose }) => {
  const { usuario } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    prioridade: '',
    funcionariosIds: []
  });
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleSelectTemplate = (template) => {
    setFormData({
      ...formData,
      titulo: template.titulo,
      descricao: template.descricao,
      prioridade: template.prioridade
    });
    setShowTemplates(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo || !formData.descricao || formData.funcionariosIds.length === 0 || !formData.prioridade) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'tarefas'), {
        titulo: formData.titulo,
        descricao: formData.descricao,
        prioridade: formData.prioridade,
        funcionariosIds: formData.funcionariosIds,
        funcionarios: formData.funcionariosIds.map(nome => ({
          id: nome,
          nome: nome
        })),
        status: 'pendente',
        dataCriacao: new Date().toISOString(),
        criadoPor: {
          id: usuario.id,
          nome: usuario.nome
        }
      });
      showToast('Tarefa criada com sucesso!', 'success');
      onClose();
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      showToast('Erro ao criar tarefa', 'error');
    }
    setLoading(false);
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

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Nova Tarefa</h2>

        <button
          type="button"
          onClick={() => setShowTemplates(true)}
          className="w-full mb-4 py-2 px-4 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-[#2C3E50] transition-colors flex items-center justify-center gap-2"
        >
          <ListChecks className="w-5 h-5" />
          Usar Modelo de Tarefa
        </button>

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
              placeholder="Digite o título da tarefa"
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
              placeholder="Digite a descrição da tarefa. Use @ para mencionar usuários (ex: @João)"
            />
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              Dica: Use @ para mencionar outros funcionários (ex: @João)
            </p>
          </div>

          <div>
            <label htmlFor="prioridade" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Prioridade
            </label>
            <select
              id="prioridade"
              value={formData.prioridade}
              onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors appearance-none"
              required
            >
              <option value="" className="bg-white dark:bg-gray-800">Selecione a prioridade</option>
              <option value="baixa" className="bg-white dark:bg-gray-800">Baixa</option>
              <option value="media" className="bg-white dark:bg-gray-800">Média</option>
              <option value="alta" className="bg-white dark:bg-gray-800">Alta</option>
            </select>
          </div>

          <div>
            <label htmlFor="funcionarios" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Funcionários Responsáveis
            </label>
            <div className="space-y-3">
              <div className="relative">
                <select
                  id="funcionarios"
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !formData.funcionariosIds.includes(e.target.value)) {
                      setFormData({
                        ...formData,
                        funcionariosIds: [...formData.funcionariosIds, e.target.value]
                      });
                    }
                    e.target.value = ""; // Reset select após selecionar
                  }}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors"
                  required={formData.funcionariosIds.length === 0}
                >
                  <option value="" className="bg-white dark:bg-gray-800">Selecione os funcionários</option>
                  {["Adriano", "Alex", "Anderson", "Bryan", "Carlos", "Claudio", "David",
                    "Ezequiel", "Fabian", "Israel", "João", "Jonathan", "Lucas", "Luan",
                    "Marcelo", "Marcos Paulo", "Moisés", "Nilton", "Ramon", "Robson", "Ruan",
                    "Vinicius"].filter(nome => !formData.funcionariosIds.includes(nome))
                    .map(nome => (
                      <option key={nome} value={nome} className="bg-white dark:bg-gray-800 p-2">{nome}</option>
                    ))
                  }
                </select>
              </div>

              {/* Lista de funcionários selecionados */}
              {formData.funcionariosIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.funcionariosIds.map((nome) => (
                    <div
                      key={nome}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full text-gray-900 dark:text-white text-sm"
                    >
                      {nome}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            funcionariosIds: formData.funcionariosIds.filter(n => n !== nome)
                          });
                        }}
                        className="ml-1 p-1 hover:text-red-500 rounded-full transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-lg hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando...' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Seleção de Template */}
      {showTemplates && (
        <SeletorTarefaPredefinida
          onSelect={handleSelectTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
};

export default CriarTarefa;

