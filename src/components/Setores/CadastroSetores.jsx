import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { Briefcase, Plus, Edit2, Trash2, Save, X, Building2, Users, DollarSign, Package, AlertCircle, XCircle } from 'lucide-react';
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
  
  // Estados para dados financeiros
  const [inventario, setInventario] = useState([]);
  const [ferramentasDanificadas, setFerramentasDanificadas] = useState([]);
  const [ferramentasPerdidas, setFerramentasPerdidas] = useState([]);
  
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
      await Promise.all([carregarEmpresas(), carregarSetores(), carregarDadosFinanceiros()]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarDadosFinanceiros = async () => {
    try {
      // Carregar inventário
      const inventarioRef = collection(db, 'inventario');
      const inventarioSnap = await getDocs(inventarioRef);
      const inventarioData = inventarioSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInventario(inventarioData);

      // Carregar ferramentas danificadas
      const danificadasRef = collection(db, 'ferramentas_danificadas');
      const danificadasSnap = await getDocs(danificadasRef);
      const danificadasData = danificadasSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFerramentasDanificadas(danificadasData);

      // Carregar ferramentas perdidas
      const perdidasRef = collection(db, 'ferramentas_perdidas');
      const perdidasSnap = await getDocs(perdidasRef);
      const perdidasData = perdidasSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFerramentasPerdidas(perdidasData);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    }
  };

  // Função para calcular valores do setor
  const calcularValoresSetor = (setorId, setorNome) => {
    // Filtrar itens do setor
    const itensSetor = inventario.filter(item => 
      item.setorId === setorId || item.setorNome === setorNome
    );

    // Calcular valor bruto
    const valorBruto = itensSetor.reduce((sum, item) => {
      const valor = parseFloat(item.valorUnitario || 0);
      const qtd = parseInt(item.quantidade || 0);
      return sum + (valor * qtd);
    }, 0);

    // Calcular descontos de danificadas
    const danificadasSetor = ferramentasDanificadas.filter(d => 
      itensSetor.some(i => 
        i.nome.toLowerCase().trim() === d.nomeItem?.toLowerCase().trim()
      )
    );
    const valorDanificadas = danificadasSetor.reduce(
      (sum, d) => sum + (parseFloat(d.valorEstimado) || 0), 0
    );

    // Calcular descontos de perdidas
    const perdidasSetor = ferramentasPerdidas.filter(p => 
      itensSetor.some(i => 
        i.nome.toLowerCase().trim() === p.nomeItem?.toLowerCase().trim()
      )
    );
    const valorPerdidas = perdidasSetor.reduce(
      (sum, p) => sum + (parseFloat(p.valorEstimado) || 0), 0
    );

    return {
      valorBruto,
      valorDanificadas,
      valorPerdidas,
      valorLiquido: valorBruto - valorDanificadas - valorPerdidas,
      totalItens: itensSetor.length,
      quantidadeTotal: itensSetor.reduce((sum, item) => sum + parseInt(item.quantidade || 0), 0)
    };
  };

  // Função para calcular valores da empresa (soma de todos os setores)
  const calcularValoresEmpresa = (empresaId) => {
    const setoresEmpresa = setores.filter(s => s.empresaId === empresaId);
    
    return setoresEmpresa.reduce((total, setor) => {
      const valores = calcularValoresSetor(setor.id, setor.nome);
      return {
        valorBruto: total.valorBruto + valores.valorBruto,
        valorDanificadas: total.valorDanificadas + valores.valorDanificadas,
        valorPerdidas: total.valorPerdidas + valores.valorPerdidas,
        valorLiquido: total.valorLiquido + valores.valorLiquido,
        totalItens: total.totalItens + valores.totalItens,
        quantidadeTotal: total.quantidadeTotal + valores.quantidadeTotal,
        totalSetores: total.totalSetores + 1
      };
    }, { 
      valorBruto: 0, 
      valorDanificadas: 0, 
      valorPerdidas: 0, 
      valorLiquido: 0,
      totalItens: 0,
      quantidadeTotal: 0,
      totalSetores: 0
    });
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
      const usuariosRef = collection(db, 'usuario');
      
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
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header Azul */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-4xl font-bold text-white flex items-center gap-3 mb-2">
          <Building2 className="w-10 h-10" />
          Gerenciamento Unificado
        </h1>
        <p className="text-blue-100 text-lg">Gerencie empresas, setores e horários personalizados</p>
      </div>

      {/* Cards de Empresas com Valores Financeiros */}
      <div className="grid grid-cols-1 gap-6">
        {empresas.map(empresa => {
          const valores = calcularValoresEmpresa(empresa.id);
          const setoresEmpresa = setores.filter(s => s.empresaId === empresa.id);
          
          return (
            <div
              key={empresa.id}
              className="rounded-2xl border-2 border-blue-200 dark:border-blue-700 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-xl hover:shadow-2xl transition-all overflow-hidden"
            >
              {/* Header da Empresa - Azul */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-3xl">
                      {empresa.nome}
                    </h3>
                    <p className="text-blue-100 text-sm">
                      {valores.totalSetores} {valores.totalSetores === 1 ? 'setor' : 'setores'} • {valores.totalItens} itens • {valores.quantidadeTotal} unidades
                    </p>
                  </div>
                </div>

                {/* Grid de Valores Financeiros */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Valor Bruto */}
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      💰 Valor Bruto
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      R$ {valores.valorBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Danificadas */}
                  <div className="bg-orange-100/90 dark:bg-orange-900/30 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                    <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Danificadas
                    </div>
                    <div className="text-xl font-bold text-orange-700 dark:text-orange-500">
                      - R$ {valores.valorDanificadas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Perdidas */}
                  <div className="bg-red-100/90 dark:bg-red-900/30 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                    <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Perdidas
                    </div>
                    <div className="text-xl font-bold text-red-700 dark:text-red-500">
                      - R$ {valores.valorPerdidas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Valor Líquido */}
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 backdrop-blur-sm rounded-xl p-4 shadow-xl border-2 border-green-400 col-span-2 lg:col-span-1">
                    <div className="text-xs font-semibold text-white mb-1">
                      ✅ Valor Líquido
                    </div>
                    <div className="text-2xl font-bold text-white">
                      R$ {valores.valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 shadow-lg col-span-2 lg:col-span-1">
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Funcionários
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {setoresEmpresa.reduce((sum, s) => sum + (funcionariosPorSetor[s.id] || 0), 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Setores da Empresa */}
              <div className="p-6">
                {setoresEmpresa.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Setores ({setoresEmpresa.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {setoresEmpresa.map(setor => {
                        const valoresSetor = calcularValoresSetor(setor.id, setor.nome);
                        return (
                          <div
                            key={setor.id}
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border-2 border-blue-300 dark:border-blue-600 shadow-md hover:shadow-lg transition-all group cursor-pointer"
                            onClick={() => handleAbrirModalSetor(setor)}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="bg-blue-500 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                  <Briefcase className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {setor.nome}
                                  </h5>
                                  <p className="text-xs text-blue-600 dark:text-blue-400">
                                    {valoresSetor.totalItens} itens • {valoresSetor.quantidadeTotal} unid.
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEditar(setor); }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleExcluir(setor.id); }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Valores do Setor */}
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Bruto:</span>
                                <span className="font-bold text-blue-700 dark:text-blue-400">
                                  R$ {valoresSetor.valorBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              {valoresSetor.valorDanificadas > 0 && (
                                <div className="flex justify-between text-orange-600 dark:text-orange-400">
                                  <span>🟠 Danificadas:</span>
                                  <span className="font-bold">
                                    - R$ {valoresSetor.valorDanificadas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )}
                              {valoresSetor.valorPerdidas > 0 && (
                                <div className="flex justify-between text-red-600 dark:text-red-400">
                                  <span>🔴 Perdidas:</span>
                                  <span className="font-bold">
                                    - R$ {valoresSetor.valorPerdidas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between pt-1.5 border-t-2 border-blue-300 dark:border-blue-600">
                                <span className="font-bold text-green-700 dark:text-green-400">✅ Líquido:</span>
                                <span className="font-bold text-green-700 dark:text-green-400">
                                  R$ {valoresSetor.valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>

                            {/* Funcionários */}
                            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                  <Users className="w-3.5 h-3.5" />
                                  <span className="text-xs font-semibold">Funcionários</span>
                                </div>
                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                  {funcionariosPorSetor[setor.id] || 0}
                                </span>
                              </div>
                            </div>

                            {/* Barra de Progresso */}
                            <div className="mt-2">
                              <div className="h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all"
                                  style={{
                                    width: `${valoresSetor.valorBruto > 0 ? (valoresSetor.valorLiquido / valoresSetor.valorBruto) * 100 : 0}%`
                                  }}
                                />
                              </div>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 text-center">
                                {valoresSetor.valorBruto > 0 ? ((valoresSetor.valorLiquido / valoresSetor.valorBruto) * 100).toFixed(1) : 0}% do valor original
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Nenhum setor cadastrado nesta empresa
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {empresas.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Nenhuma empresa cadastrada ainda
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
