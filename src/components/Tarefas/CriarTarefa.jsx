import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { X } from 'lucide-react';
import { useToast } from '../ToastProvider';

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
      <div className="bg-[#192734] rounded-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#8899A6] hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold text-white mb-6">Nova Tarefa</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-[#8899A6] mb-1">
              Título
            </label>
            <input
              type="text"
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full px-4 py-2 bg-[#253341] border border-[#38444D] rounded-lg text-white placeholder-[#8899A6] focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
              placeholder="Digite o título da tarefa"
            />
          </div>

          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-[#8899A6] mb-1">
              Descrição
            </label>
            <textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full px-4 py-2 bg-[#253341] border border-[#38444D] rounded-lg text-white placeholder-[#8899A6] focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] min-h-[100px]"
              placeholder="Digite a descrição da tarefa. Use @ para mencionar usuários (ex: @João)"
            />
            <p className="text-[#8899A6] text-xs mt-1">
              Dica: Use @ para mencionar outros funcionários (ex: @João)
            </p>
          </div>

          <div>
            <label htmlFor="prioridade" className="block text-sm font-medium text-[#8899A6] mb-1">
              Prioridade
            </label>
            <select
              id="prioridade"
              value={formData.prioridade}
              onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
              className="w-full bg-[#253341] border border-[#38444D] text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors appearance-none"
              required
            >
              <option value="" className="bg-[#192734]">Selecione a prioridade</option>
              <option value="baixa" className="bg-[#192734]">Baixa</option>
              <option value="media" className="bg-[#192734]">Média</option>
              <option value="alta" className="bg-[#192734]">Alta</option>
            </select>
          </div>

          <div>
            <label htmlFor="funcionarios" className="block text-sm font-medium text-[#8899A6] mb-1">
              Funcionários Responsáveis
            </label>
            <div className="relative">
              <select
                id="funcionarios"
                multiple
                value={formData.funcionariosIds}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                  setFormData({ ...formData, funcionariosIds: selectedOptions });
                }}
                className="w-full bg-[#253341] border border-[#38444D] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors min-h-[120px]"
                required
              >
                <option value="Jonathan" className="bg-[#192734] p-2">Jonathan</option>
                <option value="Ruan" className="bg-[#192734] p-2">Ruan</option>
                <option value="Lucas" className="bg-[#192734] p-2">Lucas</option>
                <option value="Anderson" className="bg-[#192734] p-2">Anderson</option>
                <option value="Ezequiel" className="bg-[#192734] p-2">Ezequiel</option>
                <option value="Fabian" className="bg-[#192734] p-2">Fabian</option>
                <option value="Luan" className="bg-[#192734] p-2">Luan</option>
                <option value="Moisés" className="bg-[#192734] p-2">Moisés</option>
                <option value="Robson" className="bg-[#192734] p-2">Robson</option>
                <option value="Claudio" className="bg-[#192734] p-2">Claudio</option>
                <option value="Adriano" className="bg-[#192734] p-2">Adriano</option>
                <option value="João" className="bg-[#192734] p-2">João</option>
                <option value="Nilton" className="bg-[#192734] p-2">Nilton</option>
                <option value="Carlos" className="bg-[#192734] p-2">Carlos</option>
                <option value="Marcelo" className="bg-[#192734] p-2">Marcelo</option>
                <option value="Alex" className="bg-[#192734] p-2">Alex</option>
                <option value="Bryan" className="bg-[#192734] p-2">Bryan</option>
                <option value="Vinicius" className="bg-[#192734] p-2">Vinicius</option>
                <option value="Israel" className="bg-[#192734] p-2">Israel</option>
                <option value="Ramon" className="bg-[#192734] p-2">Ramon</option>
                <option value="David" className="bg-[#192734] p-2">David</option>
                <option value="Marcos Paulo" className="bg-[#192734] p-2">Marcos Paulo</option>
              </select>
              <p className="text-[#8899A6] text-xs mt-1">
                Pressione CTRL (ou CMD no Mac) e clique para selecionar múltiplos funcionários
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#8899A6] hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a91da] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando...' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CriarTarefa;
