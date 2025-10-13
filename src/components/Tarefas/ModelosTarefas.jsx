import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, CheckCircle } from 'lucide-react';
import { collection, addDoc, query, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ToastProvider';

const ModelosTarefas = () => {
  const [modelos, setModelos] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'media',
    tipo: 'manutencao'
  });

  const { usuario } = useAuth();
  const { showToast } = useToast();

  const tiposTarefa = [
    { value: 'manutencao', label: '🔧 Manutenção', color: 'bg-blue-100 text-blue-800' },
    { value: 'limpeza', label: '🧹 Limpeza', color: 'bg-green-100 text-green-800' },
    { value: 'organizacao', label: '📦 Organização', color: 'bg-purple-100 text-purple-800' },
    { value: 'seguranca', label: '🛡️ Segurança', color: 'bg-red-100 text-red-800' },
    { value: 'inventario', label: '📋 Inventário', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'outro', label: '📌 Outro', color: 'bg-gray-100 text-gray-800' }
  ];

  const prioridades = [
    { value: 'alta', label: '🔴 Alta', color: 'bg-red-100 text-red-800' },
    { value: 'media', label: '🟡 Média', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'baixa', label: '🟢 Baixa', color: 'bg-green-100 text-green-800' }
  ];

  useEffect(() => {
    const q = query(collection(db, 'modelosTarefas'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const modelosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setModelos(modelosData);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.titulo.trim()) {
      showToast('Título é obrigatório', 'error');
      return;
    }

    try {
      if (editandoId) {
        await updateDoc(doc(db, 'modelosTarefas', editandoId), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        showToast('Modelo atualizado com sucesso!', 'success');
      } else {
        await addDoc(collection(db, 'modelosTarefas'), {
          ...formData,
          createdBy: usuario.id,
          createdAt: serverTimestamp()
        });
        showToast('Modelo criado com sucesso!', 'success');
      }

      resetForm();
    } catch (error) {
      console.error('Erro ao salvar modelo:', error);
      showToast('Erro ao salvar modelo', 'error');
    }
  };

  const handleEditar = (modelo) => {
    setFormData({
      titulo: modelo.titulo,
      descricao: modelo.descricao || '',
      prioridade: modelo.prioridade,
      tipo: modelo.tipo
    });
    setEditandoId(modelo.id);
    setMostrarForm(true);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Deseja realmente excluir este modelo?')) return;

    try {
      await deleteDoc(doc(db, 'modelosTarefas', id));
      showToast('Modelo excluído com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao excluir modelo:', error);
      showToast('Erro ao excluir modelo', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      prioridade: 'media',
      tipo: 'manutencao'
    });
    setEditandoId(null);
    setMostrarForm(false);
  };

  const getTipoInfo = (tipo) => tiposTarefa.find(t => t.value === tipo) || tiposTarefa[tiposTarefa.length - 1];
  const getPrioridadeInfo = (prioridade) => prioridades.find(p => p.value === prioridade) || prioridades[1];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">📋 Modelos de Tarefas</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Crie modelos reutilizáveis para cronogramas semanais</p>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1D9BF0] to-[#1A8CD8] text-white rounded-lg hover:from-[#1A8CD8] hover:to-[#1779BE] transition-all shadow-md"
        >
          {mostrarForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {mostrarForm ? 'Cancelar' : 'Novo Modelo'}
        </button>
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-6 mb-6 border-2 border-blue-200 dark:border-[#1D9BF0]/30">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            {editandoId ? '✏️ Editar Modelo' : '➕ Novo Modelo'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título da Tarefa *
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-[#1D9BF0] focus:border-[#1D9BF0] transition-all"
                  placeholder="Ex: Limpeza do almoxarifado"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Tarefa
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-[#1D9BF0] focus:border-[#1D9BF0] transition-all"
                >
                  {tiposTarefa.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-[#1D9BF0] focus:border-[#1D9BF0] transition-all"
                placeholder="Descreva os detalhes da tarefa..."
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prioridade Padrão
              </label>
              <div className="flex gap-3">
                {prioridades.map(prioridade => (
                  <label
                    key={prioridade.value}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg cursor-pointer transition-all ${
                      formData.prioridade === prioridade.value
                        ? prioridade.color + ' ring-2 ring-offset-2 ring-[#1D9BF0] dark:ring-offset-gray-900'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="prioridade"
                      value={prioridade.value}
                      checked={formData.prioridade === prioridade.value}
                      onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                      className="hidden"
                    />
                    {prioridade.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
              >
                <Save className="w-5 h-5" />
                {editandoId ? 'Atualizar Modelo' : 'Salvar Modelo'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Modelos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modelos.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400 text-lg">📋 Nenhum modelo cadastrado</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">Crie seu primeiro modelo de tarefa!</p>
          </div>
        ) : (
          modelos.map(modelo => {
            const tipoInfo = getTipoInfo(modelo.tipo);
            const prioridadeInfo = getPrioridadeInfo(modelo.prioridade);

            return (
              <div
                key={modelo.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-5 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${tipoInfo.color}`}>
                        {tipoInfo.label}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${prioridadeInfo.color}`}>
                        {prioridadeInfo.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">
                      {modelo.titulo}
                    </h3>
                  </div>
                </div>

                {modelo.descricao && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {modelo.descricao}
                  </p>
                )}

                <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => handleEditar(modelo)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#1D9BF0]/10 dark:bg-[#1D9BF0]/20 text-[#1D9BF0] dark:text-[#1D9BF0] rounded-lg hover:bg-[#1D9BF0]/20 dark:hover:bg-[#1D9BF0]/30 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleExcluir(modelo.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ModelosTarefas;
