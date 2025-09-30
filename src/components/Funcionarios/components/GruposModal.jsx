import React, { useState, useEffect } from 'react';
import { X, Users, Plus, Check, Search } from 'lucide-react';
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useAuth } from '../../../hooks/useAuth';

const GruposModal = ({ isOpen, onClose, funcionarios }) => {
  const { usuario } = useAuth();
  const [grupos, setGrupos] = useState([]);
  const [novoGrupo, setNovoGrupo] = useState({ nome: '', funcionarios: [] });
  const [modo, setModo] = useState('lista'); // 'lista', 'criar', 'editar'
  const [grupoSelecionado, setGrupoSelecionado] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar grupos
  useEffect(() => {
    const fetchGrupos = async () => {
      try {
        const gruposRef = collection(db, 'grupos');
        const q = query(gruposRef, where('criadoPor', '==', usuario.id));
        const snapshot = await getDocs(q);
        const gruposData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGrupos(gruposData);
      } catch (error) {
        console.error('Erro ao carregar grupos:', error);
      }
    };

    if (isOpen) {
      fetchGrupos();
    }
  }, [isOpen, usuario.id]);

  // Criar novo grupo
  const handleCriarGrupo = async () => {
    try {
      if (!novoGrupo.nome.trim() || novoGrupo.funcionarios.length === 0) {
        alert('Por favor, preencha o nome do grupo e selecione pelo menos um funcionário.');
        return;
      }

      const grupoData = {
        nome: novoGrupo.nome,
        funcionarios: novoGrupo.funcionarios,
        criadoPor: usuario.id,
        criadoEm: new Date().toISOString()
      };

      const gruposRef = collection(db, 'grupos');
      const docRef = await addDoc(gruposRef, grupoData);

      setGrupos(prev => [...prev, { id: docRef.id, ...grupoData }]);
      setNovoGrupo({ nome: '', funcionarios: [] });
      setModo('lista');
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
    }
  };

  // Atualizar grupo
  const handleAtualizarGrupo = async () => {
    try {
      if (!novoGrupo.nome.trim() || novoGrupo.funcionarios.length === 0) {
        alert('Por favor, preencha o nome do grupo e selecione pelo menos um funcionário.');
        return;
      }

      const grupoRef = doc(db, 'grupos', grupoSelecionado.id);
      await updateDoc(grupoRef, {
        nome: novoGrupo.nome,
        funcionarios: novoGrupo.funcionarios,
        atualizadoEm: new Date().toISOString()
      });

      setGrupos(prev => prev.map(grupo => 
        grupo.id === grupoSelecionado.id 
          ? { ...grupo, nome: novoGrupo.nome, funcionarios: novoGrupo.funcionarios }
          : grupo
      ));

      setNovoGrupo({ nome: '', funcionarios: [] });
      setGrupoSelecionado(null);
      setModo('lista');
    } catch (error) {
      console.error('Erro ao atualizar grupo:', error);
    }
  };

  // Excluir grupo
  const handleExcluirGrupo = async (grupoId) => {
    if (!window.confirm('Tem certeza que deseja excluir este grupo?')) return;

    try {
      await deleteDoc(doc(db, 'grupos', grupoId));
      setGrupos(prev => prev.filter(grupo => grupo.id !== grupoId));
    } catch (error) {
      console.error('Erro ao excluir grupo:', error);
    }
  };

  // Filtrar funcionários baseado na busca
  const funcionariosFiltrados = funcionarios.filter(func => 
    func.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    func.cargo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#192734] rounded-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            {modo === 'lista' ? 'Grupos de Funcionários' : 
             modo === 'criar' ? 'Criar Novo Grupo' : 'Editar Grupo'}
          </h3>
          <button
            onClick={onClose}
            className="text-[#8899A6] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {modo === 'lista' ? (
          <>
            <button
              onClick={() => {
                setNovoGrupo({ nome: '', funcionarios: [] });
                setModo('criar');
              }}
              className="mb-4 bg-[#1DA1F2] text-white px-4 py-2 rounded-lg hover:bg-[#1A91DA] transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Novo Grupo
            </button>

            <div className="space-y-3">
              {grupos.map(grupo => (
                <div
                  key={grupo.id}
                  className="bg-[#253341] rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#1DA1F2]" />
                      <h4 className="text-white font-medium">{grupo.nome}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setGrupoSelecionado(grupo);
                          setNovoGrupo({
                            nome: grupo.nome,
                            funcionarios: grupo.funcionarios
                          });
                          setModo('editar');
                        }}
                        className="text-[#1DA1F2] hover:text-[#1A91DA] transition-colors p-1"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleExcluirGrupo(grupo.id)}
                        className="text-red-500 hover:text-red-600 transition-colors p-1"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[#8899A6]">
                    {grupo.funcionarios.length} funcionário{grupo.funcionarios.length !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
              {grupos.length === 0 && (
                <p className="text-[#8899A6] text-center py-4">
                  Nenhum grupo criado ainda
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#8899A6] mb-2">
                Nome do Grupo
              </label>
              <input
                type="text"
                value={novoGrupo.nome}
                onChange={(e) => setNovoGrupo(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Digite o nome do grupo"
                className="w-full bg-[#253341] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#8899A6] mb-2">
                Buscar Funcionários
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8899A6]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome ou cargo..."
                  className="w-full bg-[#253341] text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
                />
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto mb-4">
              {funcionariosFiltrados.map(func => (
                <div
                  key={func.id}
                  className="flex items-center gap-3 p-2 hover:bg-[#253341] rounded-lg cursor-pointer"
                  onClick={() => {
                    setNovoGrupo(prev => {
                      const isSelected = prev.funcionarios.includes(func.id);
                      return {
                        ...prev,
                        funcionarios: isSelected
                          ? prev.funcionarios.filter(id => id !== func.id)
                          : [...prev.funcionarios, func.id]
                      };
                    });
                  }}
                >
                  <div className="w-5 h-5 border-2 rounded flex items-center justify-center bg-[#253341]">
                    {novoGrupo.funcionarios.includes(func.id) && (
                      <Check className="w-4 h-4 text-[#1DA1F2]" />
                    )}
                  </div>
                  <div>
                    <p className="text-white">{func.nome}</p>
                    {func.cargo && (
                      <p className="text-sm text-[#8899A6]">{func.cargo}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setNovoGrupo({ nome: '', funcionarios: [] });
                  setGrupoSelecionado(null);
                  setModo('lista');
                }}
                className="px-4 py-2 text-[#8899A6] hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={modo === 'criar' ? handleCriarGrupo : handleAtualizarGrupo}
                className="bg-[#1DA1F2] text-white px-4 py-2 rounded-lg hover:bg-[#1A91DA] transition-colors"
              >
                {modo === 'criar' ? 'Criar Grupo' : 'Salvar Alterações'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GruposModal;
