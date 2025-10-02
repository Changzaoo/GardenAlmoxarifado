import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Building2, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useToast } from '../ToastProvider';

const CadastroEmpresas = () => {
  const { showToast } = useToast();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [novaEmpresa, setNovaEmpresa] = useState({
    nome: '',
    cnpj: '',
    endereco: '',
    telefone: '',
    email: '',
    ativo: true
  });

  useEffect(() => {
    carregarEmpresas();
  }, []);

  const carregarEmpresas = async () => {
    try {
      setLoading(true);
      const empresasRef = collection(db, 'empresas');
      const snapshot = await getDocs(empresasRef);
      const empresasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmpresas(empresasData);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      showToast('Erro ao carregar empresas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!novaEmpresa.nome.trim()) {
      showToast('Nome da empresa é obrigatório', 'warning');
      return;
    }

    try {
      const empresasRef = collection(db, 'empresas');
      await addDoc(empresasRef, {
        ...novaEmpresa,
        dataCriacao: serverTimestamp(),
        dataAtualizacao: serverTimestamp()
      });

      showToast('Empresa cadastrada com sucesso!', 'success');
      setNovaEmpresa({
        nome: '',
        cnpj: '',
        endereco: '',
        telefone: '',
        email: '',
        ativo: true
      });
      carregarEmpresas();
    } catch (error) {
      console.error('Erro ao cadastrar empresa:', error);
      showToast('Erro ao cadastrar empresa', 'error');
    }
  };

  const handleEditar = (empresa) => {
    setEditando(empresa.id);
    setNovaEmpresa({
      nome: empresa.nome || '',
      cnpj: empresa.cnpj || '',
      endereco: empresa.endereco || '',
      telefone: empresa.telefone || '',
      email: empresa.email || '',
      ativo: empresa.ativo !== false
    });
  };

  const handleAtualizar = async (empresaId) => {
    if (!novaEmpresa.nome.trim()) {
      showToast('Nome da empresa é obrigatório', 'warning');
      return;
    }

    try {
      const empresaRef = doc(db, 'empresas', empresaId);
      await updateDoc(empresaRef, {
        ...novaEmpresa,
        dataAtualizacao: serverTimestamp()
      });

      showToast('Empresa atualizada com sucesso!', 'success');
      setEditando(null);
      setNovaEmpresa({
        nome: '',
        cnpj: '',
        endereco: '',
        telefone: '',
        email: '',
        ativo: true
      });
      carregarEmpresas();
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      showToast('Erro ao atualizar empresa', 'error');
    }
  };

  const handleExcluir = async (empresaId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta empresa?')) {
      return;
    }

    try {
      const empresaRef = doc(db, 'empresas', empresaId);
      await deleteDoc(empresaRef);
      showToast('Empresa excluída com sucesso!', 'success');
      carregarEmpresas();
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      showToast('Erro ao excluir empresa', 'error');
    }
  };

  const handleCancelar = () => {
    setEditando(null);
    setNovaEmpresa({
      nome: '',
      cnpj: '',
      endereco: '',
      telefone: '',
      email: '',
      ativo: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Carregando empresas...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8" />
          Cadastro de Empresas
        </h1>
        <p className="text-gray-600">Gerencie as empresas do sistema</p>
      </div>

      {/* Formulário de Cadastro/Edição */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          {editando ? 'Editar Empresa' : 'Nova Empresa'}
        </h2>
        <form onSubmit={editando ? (e) => { e.preventDefault(); handleAtualizar(editando); } : handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                Nome da Empresa *
              </label>
              <input
                type="text"
                value={novaEmpresa.nome}
                onChange={(e) => setNovaEmpresa({ ...novaEmpresa, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: Garden Almoxarifado"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                CNPJ
              </label>
              <input
                type="text"
                value={novaEmpresa.cnpj}
                onChange={(e) => setNovaEmpresa({ ...novaEmpresa, cnpj: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                Endereço
              </label>
              <input
                type="text"
                value={novaEmpresa.endereco}
                onChange={(e) => setNovaEmpresa({ ...novaEmpresa, endereco: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Rua, número, bairro"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                Telefone
              </label>
              <input
                type="text"
                value={novaEmpresa.telefone}
                onChange={(e) => setNovaEmpresa({ ...novaEmpresa, telefone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="(00) 0000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                E-mail
              </label>
              <input
                type="email"
                value={novaEmpresa.email}
                onChange={(e) => setNovaEmpresa({ ...novaEmpresa, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="contato@empresa.com"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={novaEmpresa.ativo}
                  onChange={(e) => setNovaEmpresa({ ...novaEmpresa, ativo: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Empresa Ativa</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            {editando ? (
              <>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </button>
                <button
                  type="button"
                  onClick={handleCancelar}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Empresa
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lista de Empresas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Empresas Cadastradas ({empresas.length})
        </h2>
        
        {empresas.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            Nenhuma empresa cadastrada ainda
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">CNPJ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Telefone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {empresas.map((empresa) => (
                  <tr key={empresa.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{empresa.nome}</div>
                        {empresa.email && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{empresa.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{empresa.cnpj || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{empresa.telefone || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        empresa.ativo !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {empresa.ativo !== false ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditar(empresa)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExcluir(empresa.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CadastroEmpresas;
