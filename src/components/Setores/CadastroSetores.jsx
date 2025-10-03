import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { Briefcase, Plus, Edit2, Trash2, Save, X, Building2, Users } from 'lucide-react';
import { useToast } from '../ToastProvider';
import ModalFuncionariosSetor from './ModalFuncionariosSetor';

const CadastroSetores = () => {
  const { showToast } = useToast();
  const [setores, setSetores] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');
  const [funcionariosPorSetor, setFuncionariosPorSetor] = useState({});
  const [totalFuncionarios, setTotalFuncionarios] = useState(0);
  const [modalSetorAberto, setModalSetorAberto] = useState(false);
  const [setorSelecionado, setSetorSelecionado] = useState(null);
  const [novoSetor, setNovoSetor] = useState({
    nome: '',
    empresaId: '',
    empresaNome: '',
    descricao: '',
    responsavel: '',
    ativo: true
  });

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (empresaSelecionada) {
      carregarSetoresPorEmpresa(empresaSelecionada);
    } else {
      carregarSetores();
    }
  }, [empresaSelecionada]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      await Promise.all([carregarEmpresas(), carregarSetores()]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarEmpresas = async () => {
    try {
      const empresasRef = collection(db, 'empresas');
      const snapshot = await getDocs(empresasRef);
      const empresasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmpresas(empresasData.filter(e => e.ativo !== false));
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const carregarSetores = async () => {
    try {
      const setoresRef = collection(db, 'setores');
      const snapshot = await getDocs(setoresRef);
      const setoresData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSetores(setoresData);
      
      // Carregar contagem de funcionários
      await carregarContagemFuncionarios(setoresData);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    }
  };

  const carregarContagemFuncionarios = async (setoresData) => {
    try {
      // Buscar de ambas as coleções
      const funcionariosRef = collection(db, 'funcionarios');
      const usuariosRef = collection(db, 'usuarios');
      
      const [funcionariosSnap, usuariosSnap] = await Promise.all([
        getDocs(funcionariosRef),
        getDocs(usuariosRef)
      ]);

      // Combinar dados de ambas as coleções
      const todosFuncionarios = [
        ...funcionariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...usuariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      ];

      // Remover duplicatas (baseado no ID)
      const funcionariosUnicos = Array.from(
        new Map(todosFuncionarios.map(f => [f.id, f])).values()
      );

      // Filtrar apenas funcionários que TÊM setor e empresa definidos E não estão demitidos
      const funcionariosComSetor = funcionariosUnicos.filter(
        func => func.setorId && func.setorId.trim() !== '' && 
                func.empresaId && func.empresaId.trim() !== '' &&
                !func.demitido
      );

      setTotalFuncionarios(funcionariosComSetor.length);

      // Contar funcionários por setor
      const contagem = {};
      setoresData.forEach(setor => {
        contagem[setor.id] = funcionariosComSetor.filter(
          func => func.setorId === setor.id
        ).length;
      });

      setFuncionariosPorSetor(contagem);
    } catch (error) {
      console.error('Erro ao carregar contagem de funcionários:', error);
    }
  };

  const carregarSetoresPorEmpresa = async (empresaId) => {
    try {
      const setoresRef = collection(db, 'setores');
      const q = query(setoresRef, where('empresaId', '==', empresaId));
      const snapshot = await getDocs(q);
      const setoresData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSetores(setoresData);
      
      // Carregar contagem de funcionários
      await carregarContagemFuncionarios(setoresData);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!novoSetor.nome.trim()) {
      showToast('Nome do setor é obrigatório', 'warning');
      return;
    }

    if (!novoSetor.empresaId) {
      showToast('Selecione uma empresa', 'warning');
      return;
    }

    try {
      const empresaSelecionadaData = empresas.find(e => e.id === novoSetor.empresaId);
      
      const setoresRef = collection(db, 'setores');
      await addDoc(setoresRef, {
        ...novoSetor,
        empresaNome: empresaSelecionadaData?.nome || '',
        dataCriacao: serverTimestamp(),
        dataAtualizacao: serverTimestamp()
      });

      showToast('Setor cadastrado com sucesso!', 'success');
      setNovoSetor({
        nome: '',
        empresaId: '',
        empresaNome: '',
        descricao: '',
        responsavel: '',
        ativo: true
      });
      
      if (empresaSelecionada) {
        carregarSetoresPorEmpresa(empresaSelecionada);
      } else {
        carregarSetores();
      }
    } catch (error) {
      console.error('Erro ao cadastrar setor:', error);
      showToast('Erro ao cadastrar setor', 'error');
    }
  };

  const handleEditar = (setor) => {
    setEditando(setor.id);
    setNovoSetor({
      nome: setor.nome || '',
      empresaId: setor.empresaId || '',
      empresaNome: setor.empresaNome || '',
      descricao: setor.descricao || '',
      responsavel: setor.responsavel || '',
      ativo: setor.ativo !== false
    });
  };

  const handleAtualizar = async (setorId) => {
    if (!novoSetor.nome.trim()) {
      showToast('Nome do setor é obrigatório', 'warning');
      return;
    }

    if (!novoSetor.empresaId) {
      showToast('Selecione uma empresa', 'warning');
      return;
    }

    try {
      const empresaSelecionadaData = empresas.find(e => e.id === novoSetor.empresaId);
      
      const setorRef = doc(db, 'setores', setorId);
      await updateDoc(setorRef, {
        ...novoSetor,
        empresaNome: empresaSelecionadaData?.nome || '',
        dataAtualizacao: serverTimestamp()
      });

      showToast('Setor atualizado com sucesso!', 'success');
      setEditando(null);
      setNovoSetor({
        nome: '',
        empresaId: '',
        empresaNome: '',
        descricao: '',
        responsavel: '',
        ativo: true
      });
      
      if (empresaSelecionada) {
        carregarSetoresPorEmpresa(empresaSelecionada);
      } else {
        carregarSetores();
      }
    } catch (error) {
      console.error('Erro ao atualizar setor:', error);
      showToast('Erro ao atualizar setor', 'error');
    }
  };

  const handleExcluir = async (setorId) => {
    if (!window.confirm('Tem certeza que deseja excluir este setor?')) {
      return;
    }

    try {
      const setorRef = doc(db, 'setores', setorId);
      await deleteDoc(setorRef);
      showToast('Setor excluído com sucesso!', 'success');
      
      if (empresaSelecionada) {
        carregarSetoresPorEmpresa(empresaSelecionada);
      } else {
        carregarSetores();
      }
    } catch (error) {
      console.error('Erro ao excluir setor:', error);
      showToast('Erro ao excluir setor', 'error');
    }
  };

  const handleCancelar = () => {
    setEditando(null);
    setNovoSetor({
      nome: '',
      empresaId: '',
      empresaNome: '',
      descricao: '',
      responsavel: '',
      ativo: true
    });
  };

  const handleAbrirModalSetor = (setor) => {
    setSetorSelecionado(setor);
    setModalSetorAberto(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Carregando setores...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <Briefcase className="w-8 h-8" />
          Cadastro de Setores
        </h1>
        <p className="text-gray-600">Gerencie os setores de cada empresa</p>
      </div>

      {/* Filtro por Empresa */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
          Filtrar por Empresa
        </label>
        <select
          value={empresaSelecionada}
          onChange={(e) => setEmpresaSelecionada(e.target.value)}
          className="w-full md:w-96 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as empresas</option>
          {empresas.map(empresa => (
            <option key={empresa.id} value={empresa.id}>
              {empresa.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Formulário de Cadastro/Edição */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          {editando ? 'Editar Setor' : 'Novo Setor'}
        </h2>
        <form onSubmit={editando ? (e) => { e.preventDefault(); handleAtualizar(editando); } : handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                Empresa *
              </label>
              <select
                value={novoSetor.empresaId}
                onChange={(e) => setNovoSetor({ ...novoSetor, empresaId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Selecione uma empresa</option>
                {empresas.map(empresa => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                Nome do Setor *
              </label>
              <input
                type="text"
                value={novoSetor.nome}
                onChange={(e) => setNovoSetor({ ...novoSetor, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: Recursos Humanos, TI, Produção"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                Descrição
              </label>
              <textarea
                value={novoSetor.descricao}
                onChange={(e) => setNovoSetor({ ...novoSetor, descricao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Descrição do setor"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                Responsável
              </label>
              <input
                type="text"
                value={novoSetor.responsavel}
                onChange={(e) => setNovoSetor({ ...novoSetor, responsavel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Nome do responsável"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={novoSetor.ativo}
                  onChange={(e) => setNovoSetor({ ...novoSetor, ativo: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Setor Ativo</span>
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
                Cadastrar Setor
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Estatísticas */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-full p-4 shadow-md">
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total de Funcionários</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalFuncionarios}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">Setores Cadastrados</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{setores.length}</div>
          </div>
        </div>
      </div>

      {/* Lista de Setores */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          Setores Cadastrados ({setores.length})
        </h2>
        
        {setores.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            {empresaSelecionada 
              ? 'Nenhum setor cadastrado para esta empresa'
              : 'Nenhum setor cadastrado ainda'
            }
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Setor</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Empresa</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Responsável</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Funcionários</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {setores.map((setor) => (
                  <tr key={setor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <div>
                        <button
                          onClick={() => handleAbrirModalSetor(setor)}
                          className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline text-left transition-colors"
                        >
                          {setor.nome}
                        </button>
                        {setor.descricao && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{setor.descricao}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{setor.empresaNome || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{setor.responsavel || '-'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleAbrirModalSetor(setor)}
                        className="flex items-center justify-center gap-2 w-full hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg py-2 transition-colors group"
                        title="Ver funcionários"
                      >
                        <Users className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-lg text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                          {funcionariosPorSetor[setor.id] || 0}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        setor.ativo !== false
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {setor.ativo !== false ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditar(setor)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExcluir(setor.id)}
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

      {/* Modal de Funcionários do Setor */}
      <ModalFuncionariosSetor
        isOpen={modalSetorAberto}
        onClose={() => setModalSetorAberto(false)}
        setor={setorSelecionado}
      />
    </div>
  );
};

export default CadastroSetores;
