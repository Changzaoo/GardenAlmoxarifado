import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { 
  Building2, 
  Briefcase, 
  DollarSign, 
  Package, 
  TrendingUp, 
  AlertCircle,
  ChevronRight,
  BarChart3,
  Layers
} from 'lucide-react';
import { isAdmin as checkIsAdmin, hasManagementPermission } from '../../constants/permissoes';

const EmpresasSetoresFinanceiro = ({ usuarioAtual }) => {
  const [empresas, setEmpresas] = useState([]);
  const [setores, setSetores] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [ferramentasDanificadas, setFerramentasDanificadas] = useState([]);
  const [ferramentasPerdidas, setFerramentasPerdidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);

  const isAdmin = checkIsAdmin(usuarioAtual?.nivel) || hasManagementPermission(usuarioAtual?.nivel);

  useEffect(() => {
    carregarTodosDados();
  }, []);

  const carregarTodosDados = async () => {
    try {
      setLoading(true);
      await Promise.all([
        carregarEmpresas(),
        carregarSetores(),
        carregarInventario(),
        carregarFerramentasDanificadas(),
        carregarFerramentasPerdidas()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarEmpresas = async () => {
    const snapshot = await getDocs(collection(db, 'empresas'));
    const empresasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setEmpresas(empresasData.filter(e => e.ativo !== false));
  };

  const carregarSetores = async () => {
    const snapshot = await getDocs(collection(db, 'setores'));
    const setoresData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSetores(setoresData.filter(s => s.ativo !== false));
  };

  const carregarInventario = async () => {
    const snapshot = await getDocs(collection(db, 'inventario'));
    const inventarioData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setInventario(inventarioData);
  };

  const carregarFerramentasDanificadas = async () => {
    const snapshot = await getDocs(collection(db, 'ferramentas_danificadas'));
    const danificadasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setFerramentasDanificadas(danificadasData);
  };

  const carregarFerramentasPerdidas = async () => {
    const snapshot = await getDocs(collection(db, 'ferramentas_perdidas'));
    const perdidasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setFerramentasPerdidas(perdidasData);
  };

  // Calcular valores por setor
  const calcularValoresSetor = (setorId) => {
    // Filtrar inventário do setor
    const itensSetor = inventario.filter(item => item.setorId === setorId);
    
    // Calcular valor bruto
    const valorBruto = itensSetor.reduce((total, item) => {
      const valor = (parseFloat(item.valorUnitario) || 0) * (parseInt(item.quantidade) || 0);
      return total + valor;
    }, 0);

    // Calcular descontos por ferramentas danificadas/perdidas
    let valorDanificadas = 0;
    let valorPerdidas = 0;

    itensSetor.forEach(item => {
      const itemNormalized = item.nome.toLowerCase().trim();
      
      // Danificadas do setor
      valorDanificadas += ferramentasDanificadas
        .filter(f => 
          f.setorId === setorId && 
          f.nomeItem && 
          f.nomeItem.toLowerCase().trim() === itemNormalized
        )
        .reduce((sum, f) => sum + (parseFloat(f.valorEstimado) || 0), 0);
      
      // Perdidas do setor
      valorPerdidas += ferramentasPerdidas
        .filter(f => 
          f.setorId === setorId && 
          f.nomeItem && 
          f.nomeItem.toLowerCase().trim() === itemNormalized
        )
        .reduce((sum, f) => sum + (parseFloat(f.valorEstimado) || 0), 0);
    });

    const valorLiquido = valorBruto - valorDanificadas - valorPerdidas;

    return {
      valorBruto,
      valorDanificadas,
      valorPerdidas,
      valorLiquido,
      totalItens: itensSetor.length,
      quantidadeTotal: itensSetor.reduce((sum, item) => sum + (parseInt(item.quantidade) || 0), 0)
    };
  };

  // Calcular valores por empresa
  const calcularValoresEmpresa = (empresaId) => {
    const setoresEmpresa = setores.filter(s => s.empresaId === empresaId);
    
    let valorBruto = 0;
    let valorDanificadas = 0;
    let valorPerdidas = 0;
    let totalItens = 0;
    let quantidadeTotal = 0;

    setoresEmpresa.forEach(setor => {
      const valores = calcularValoresSetor(setor.id);
      valorBruto += valores.valorBruto;
      valorDanificadas += valores.valorDanificadas;
      valorPerdidas += valores.valorPerdidas;
      totalItens += valores.totalItens;
      quantidadeTotal += valores.quantidadeTotal;
    });

    const valorLiquido = valorBruto - valorDanificadas - valorPerdidas;

    return {
      valorBruto,
      valorDanificadas,
      valorPerdidas,
      valorLiquido,
      totalItens,
      quantidadeTotal,
      totalSetores: setoresEmpresa.length
    };
  };

  // Totais gerais
  const totaisGerais = useMemo(() => {
    let valorBruto = 0;
    let valorDanificadas = 0;
    let valorPerdidas = 0;

    empresas.forEach(empresa => {
      const valores = calcularValoresEmpresa(empresa.id);
      valorBruto += valores.valorBruto;
      valorDanificadas += valores.valorDanificadas;
      valorPerdidas += valores.valorPerdidas;
    });

    return {
      valorBruto,
      valorDanificadas,
      valorPerdidas,
      valorLiquido: valorBruto - valorDanificadas - valorPerdidas
    };
  }, [empresas, setores, inventario, ferramentasDanificadas, ferramentasPerdidas]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-blue-600 dark:text-blue-400 font-semibold">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-6 lg:p-8">
      {/* Header Principal */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Gestão Financeira
              </h1>
              <p className="text-blue-100 text-lg">
                Empresas, Setores e Inventário
              </p>
            </div>
          </div>

          {/* Cards de Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm font-medium">Valor Bruto</span>
                <DollarSign className="w-5 h-5 text-green-300" />
              </div>
              <p className="text-2xl font-bold text-white">
                {totaisGerais.valorBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm font-medium">Danificadas</span>
                <AlertCircle className="w-5 h-5 text-orange-300" />
              </div>
              <p className="text-2xl font-bold text-orange-200">
                - {totaisGerais.valorDanificadas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm font-medium">Perdidas</span>
                <AlertCircle className="w-5 h-5 text-red-300" />
              </div>
              <p className="text-2xl font-bold text-red-200">
                - {totaisGerais.valorPerdidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">Valor Líquido</span>
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">
                {totaisGerais.valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Empresas */}
      <div className="max-w-7xl mx-auto space-y-6">
        {empresas.map(empresa => {
          const valoresEmpresa = calcularValoresEmpresa(empresa.id);
          const setoresEmpresa = setores.filter(s => s.empresaId === empresa.id);
          const isExpanded = empresaSelecionada?.id === empresa.id;

          return (
            <div key={empresa.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              {/* Header da Empresa */}
              <button
                onClick={() => setEmpresaSelecionada(isExpanded ? null : empresa)}
                className="w-full p-6 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {empresa.nome}
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {valoresEmpresa.totalSetores} setores • {valoresEmpresa.totalItens} itens no inventário
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Valores da Empresa */}
                    <div className="hidden lg:grid grid-cols-4 gap-4 text-right">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Valor Bruto</p>
                        <p className="font-bold text-gray-700 dark:text-gray-300">
                          {valoresEmpresa.valorBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-orange-500 mb-1">Danificadas</p>
                        <p className="font-bold text-orange-600 dark:text-orange-400">
                          - {valoresEmpresa.valorDanificadas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-red-500 mb-1">Perdidas</p>
                        <p className="font-bold text-red-600 dark:text-red-400">
                          - {valoresEmpresa.valorPerdidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600 dark:text-green-400 mb-1">Líquido</p>
                        <p className="font-bold text-xl text-green-600 dark:text-green-400">
                          {valoresEmpresa.valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                    </div>

                    <ChevronRight 
                      className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </div>
                </div>

                {/* Valores Mobile */}
                <div className="lg:hidden mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Valor Bruto</p>
                    <p className="font-bold text-sm text-gray-700 dark:text-gray-300">
                      {valoresEmpresa.valorBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <p className="text-xs text-green-600 dark:text-green-400 mb-1">Líquido</p>
                    <p className="font-bold text-sm text-green-600 dark:text-green-400">
                      {valoresEmpresa.valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>
              </button>

              {/* Setores da Empresa */}
              {isExpanded && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6 border-t-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                      Setores ({setoresEmpresa.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {setoresEmpresa.map(setor => {
                      const valoresSetor = calcularValoresSetor(setor.id);

                      return (
                        <div 
                          key={setor.id}
                          className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md hover:shadow-xl transition-all border-l-4 border-blue-500"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                              <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 dark:text-white">
                                {setor.nome}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {valoresSetor.totalItens} itens • {valoresSetor.quantidadeTotal} unidades
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Valor Bruto</span>
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {valoresSetor.valorBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                            </div>

                            {valoresSetor.valorDanificadas > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-orange-500">Danificadas</span>
                                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                  - {valoresSetor.valorDanificadas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              </div>
                            )}

                            {valoresSetor.valorPerdidas > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-red-500">Perdidas</span>
                                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                                  - {valoresSetor.valorPerdidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              </div>
                            )}

                            <div className="pt-2 border-t-2 border-gray-200 dark:border-gray-700">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Líquido</span>
                                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                  {valoresSetor.valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {setoresEmpresa.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Nenhum setor cadastrado para esta empresa
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {empresas.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-xl">
            <Building2 className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
              Nenhuma Empresa Cadastrada
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Comece cadastrando uma empresa para visualizar os dados financeiros
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmpresasSetoresFinanceiro;
