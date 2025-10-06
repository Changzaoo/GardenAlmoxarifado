import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { X, ListChecks } from 'lucide-react';
import { useToast } from '../ToastProvider';
import SeletorTarefaPredefinida from './SeletorTarefaPredefinida';
import { notificarNovaTarefa } from '../../services/tarefaNotificationService';
import { useFuncionarios } from '../Funcionarios/FuncionariosProvider';

const CriarTarefa = ({ onClose }) => {
  const { usuario } = useAuth();
  const { showToast } = useToast();
  const { funcionarios } = useFuncionarios();
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    prioridade: '',
    funcionariosIds: [] // Agora armazenará IDs reais dos funcionários
  });
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState([]); // Objetos completos para exibição
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
      const tarefaData = {
        titulo: formData.titulo,
        descricao: formData.descricao,
        prioridade: formData.prioridade,
        funcionariosIds: formData.funcionariosIds, // Agora contém IDs reais
        funcionarios: funcionariosSelecionados.map(func => ({
          id: func.id,
          nome: func.nome || func.username || func.email || 'Sem nome'
        })),
        status: 'pendente',
        dataCriacao: new Date().toISOString(),
        criadoPor: {
          id: usuario.id,
          nome: usuario.nome
        }
      };

      const docRef = await addDoc(collection(db, 'tarefas'), tarefaData);
      
      // Criar notificação para cada funcionário atribuído
      try {
        console.log('🔔 Criando notificações para funcionários:', formData.funcionariosIds);
        for (const funcionarioId of formData.funcionariosIds) {
          const funcionario = funcionariosSelecionados.find(f => f.id === funcionarioId);
          const nomeFuncionario = funcionario ? (funcionario.nome || funcionario.username || funcionario.email) : 'Funcionário';
          
          console.log(`📬 Enviando notificação para: ${nomeFuncionario} (ID: ${funcionarioId})`);
          await notificarNovaTarefa(
            funcionarioId,
            formData.titulo,
            formData.prioridade,
            { id: docRef.id, ...tarefaData }
          );
        }
        console.log('✅ Todas as notificações foram criadas com sucesso');
      } catch (notificationError) {
        console.error('❌ Erro ao criar notificações da tarefa:', notificationError);
        // Não bloqueia a criação da tarefa mesmo se a notificação falhar
      }

      showToast('Tarefa criada com sucesso!', 'success');
      onClose();
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      showToast('Erro ao criar tarefa', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pb-24 md:pb-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md relative max-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-4rem)] overflow-y-auto">
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
                    const funcionarioId = e.target.value;
                    if (funcionarioId && !formData.funcionariosIds.includes(funcionarioId)) {
                      const funcionario = funcionarios.find(f => f.id === funcionarioId);
                      if (funcionario) {
                        setFormData({
                          ...formData,
                          funcionariosIds: [...formData.funcionariosIds, funcionarioId]
                        });
                        setFuncionariosSelecionados([...funcionariosSelecionados, funcionario]);
                      }
                    }
                    e.target.value = ""; // Reset select após selecionar
                  }}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors"
                  required={formData.funcionariosIds.length === 0}
                >
                  <option value="" className="bg-white dark:bg-gray-800">Selecione os funcionários</option>
                  {funcionarios
                    .filter(func => !formData.funcionariosIds.includes(func.id))
                    .sort((a, b) => (a.nome || a.username || '').localeCompare(b.nome || b.username || ''))
                    .map(func => (
                      <option key={func.id} value={func.id} className="bg-white dark:bg-gray-800 p-2">
                        {func.nome || func.username || func.email || 'Sem nome'}
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* Lista de funcionários selecionados */}
              {funcionariosSelecionados.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {funcionariosSelecionados.map((func) => (
                    <div
                      key={func.id}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full text-gray-900 dark:text-white text-sm"
                    >
                      {func.nome || func.username || func.email || 'Sem nome'}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            funcionariosIds: formData.funcionariosIds.filter(id => id !== func.id)
                          });
                          setFuncionariosSelecionados(funcionariosSelecionados.filter(f => f.id !== func.id));
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

