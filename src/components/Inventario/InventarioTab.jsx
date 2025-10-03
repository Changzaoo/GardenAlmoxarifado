// InventarioTab.jsx - Página Unificada de Gestão de Inventário

import React, { useState, useMemo } from 'react';
import { Package, ShoppingCart, Wrench, AlertCircle, ClipboardCheck } from 'lucide-react';
import NovoItem from './NovoItem';
import ListaInventario from './ListaInventario';
import ComprasTab from '../Compras/ComprasTab';
import FerramentasDanificadasTab from '../Danificadas/FerramentasDanificadasTab';
import FerramentasPerdidasTab from '../Perdidas/FerramentasPerdidasTab';
import VerificacaoMensalTab from './VerificacaoMensalTab';
import { useAuth } from '../../hooks/useAuth';
import { useSectorPermissions } from '../../hooks/useSectorPermissions';
import { Shield, Building2 } from 'lucide-react';

const TABS = {
  INVENTARIO: 'inventario',
  COMPRAS: 'compras',
  DANIFICADAS: 'danificadas',
  PERDIDAS: 'perdidas',
  VERIFICACAO: 'verificacao'
};

const InventarioTab = ({
  inventario,
  emprestimos,
  adicionarItem,
  removerItem,
  atualizarItem,
  obterDetalhesEmprestimos,
  // Props de Compras
  compras,
  funcionarios,
  adicionarCompra,
  removerCompra,
  atualizarCompra,
  // Props de Danificadas
  ferramentasDanificadas,
  adicionarFerramentaDanificada,
  atualizarFerramentaDanificada,
  removerFerramentaDanificada,
  // Props de Perdidas
  ferramentasPerdidas,
  adicionarFerramentaPerdida,
  atualizarFerramentaPerdida,
  removerFerramentaPerdida
}) => {
  const { usuario } = useAuth();
  const { 
    filterBySector, 
    canViewAllSectors, 
    userSetorNome, 
    getPermissionScope 
  } = useSectorPermissions();
  
  const [abaAtiva, setAbaAtiva] = useState(TABS.INVENTARIO);
  const isFuncionario = usuario?.nivel === 1;

  // Filtrar inventário por setor
  const inventarioFiltrado = useMemo(() => {
    return filterBySector(inventario);
  }, [inventario, filterBySector]);

  // Filtrar empréstimos por setor
  const emprestimosFiltrados = useMemo(() => {
    return filterBySector(emprestimos);
  }, [emprestimos, filterBySector]);

  // Calcular badges de contadores
  const badges = useMemo(() => {
    return {
      inventario: inventarioFiltrado.length,
      compras: compras?.filter(c => c.status === 'solicitado' || c.status === 'aprovado').length || 0,
      danificadas: ferramentasDanificadas?.filter(f => f.statusReparo !== 'reparada' && f.statusReparo !== 'substituida').length || 0,
      perdidas: ferramentasPerdidas?.filter(p => p.statusBusca === 'buscando').length || 0,
      verificacao: 0
    };
  }, [inventarioFiltrado, compras, ferramentasDanificadas, ferramentasPerdidas]);

  // Calcular valores totais
  const valores = useMemo(() => {
    const valorTotalInventarioBruto = inventarioFiltrado.reduce((total, item) => {
      const valor = parseFloat(item.valorUnitario) || 0;
      const qtd = parseInt(item.quantidade) || 0;
      return total + (valor * qtd);
    }, 0);

    const valorTotalCompras = compras?.filter(c => c.status === 'solicitado' || c.status === 'aprovado').reduce((total, compra) => {
      const valor = parseFloat(compra.valorUnitario) || 0;
      const qtd = parseInt(compra.quantidade) || 0;
      return total + (valor * qtd);
    }, 0) || 0;

    const valorTotalDanificadas = ferramentasDanificadas?.filter(f => f.statusReparo !== 'reparada' && f.statusReparo !== 'substituida').reduce((total, ferr) => {
      const valor = parseFloat(ferr.valorUnitario) || 0;
      return total + valor;
    }, 0) || 0;

    const valorTotalPerdidas = ferramentasPerdidas?.filter(p => p.statusBusca === 'buscando' || p.statusBusca === 'perdida_definitiva').reduce((total, ferr) => {
      const valor = parseFloat(ferr.valorUnitario) || 0;
      return total + valor;
    }, 0) || 0;

    // Descontar perdidas e danificadas do inventário
    const valorTotalInventario = valorTotalInventarioBruto - valorTotalDanificadas - valorTotalPerdidas;

    return {
      inventario: valorTotalInventario,
      inventarioBruto: valorTotalInventarioBruto,
      compras: valorTotalCompras,
      danificadas: valorTotalDanificadas,
      perdidas: valorTotalPerdidas
    };
  }, [inventarioFiltrado, compras, ferramentasDanificadas, ferramentasPerdidas]);

  const tabs = [
    {
      id: TABS.INVENTARIO,
      label: 'Inventário',
      icon: Package,
      badge: badges.inventario,
      color: 'blue'
    },
    {
      id: TABS.COMPRAS,
      label: 'Compras',
      icon: ShoppingCart,
      badge: badges.compras,
      color: 'green'
    },
    {
      id: TABS.DANIFICADAS,
      label: 'Danificadas',
      icon: Wrench,
      badge: badges.danificadas,
      color: 'orange'
    },
    {
      id: TABS.PERDIDAS,
      label: 'Perdidas',
      icon: AlertCircle,
      badge: badges.perdidas,
      color: 'red'
    },
    {
      id: TABS.VERIFICACAO,
      label: 'Verificação',
      icon: ClipboardCheck,
      badge: badges.verificacao,
      color: 'purple'
    }
  ];

  const renderConteudoAba = () => {
    switch (abaAtiva) {
      case TABS.INVENTARIO:
        return (
          <div className="space-y-6">
            {/* Badge de informação de setor */}
            {!canViewAllSectors && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg px-4 py-3 flex items-center gap-3">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    {getPermissionScope()}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    Você está visualizando apenas os itens do seu setor ({inventarioFiltrado.length} itens)
                  </p>
                </div>
              </div>
            )}

            {canViewAllSectors && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg px-4 py-3 flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Modo Administrador - Visualizando todos os setores
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                    Total de {inventarioFiltrado.length} itens em todos os setores
                  </p>
                </div>
              </div>
            )}

            {/* Card de Valor Total do Inventário */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-2 border-blue-300 dark:border-blue-600 rounded-xl px-6 py-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 dark:bg-blue-600 p-3 rounded-xl shadow-md">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Valor Total do Inventário
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {inventarioFiltrado.length} itens em estoque
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {valores.inventario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  {(valores.danificadas > 0 || valores.perdidas > 0) && (
                    <div className="text-xs text-blue-500 dark:text-blue-500 mt-1 space-y-0.5">
                      <p className="text-gray-500 dark:text-gray-400">
                        Valor bruto: {valores.inventarioBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      {valores.danificadas > 0 && (
                        <p className="text-orange-600 dark:text-orange-400">
                          - Danificadas: {valores.danificadas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      )}
                      {valores.perdidas > 0 && (
                        <p className="text-red-600 dark:text-red-400">
                          - Perdidas: {valores.perdidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      )}
                    </div>
                  )}
                  {!(valores.danificadas > 0 || valores.perdidas > 0) && (
                    <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">
                      Valor patrimonial
                    </p>
                  )}
                </div>
              </div>
            </div>

            {!isFuncionario && (
              <NovoItem
                adicionarItem={adicionarItem}
                userSetorId={usuario?.setorId}
                userSetorNome={userSetorNome}
              />
            )}
            <ListaInventario
              inventario={inventarioFiltrado}
              emprestimos={emprestimosFiltrados}
              removerItem={removerItem}
              atualizarItem={atualizarItem}
              readonly={isFuncionario}
              obterDetalhesEmprestimos={obterDetalhesEmprestimos}
            />
          </div>
        );

      case TABS.COMPRAS:
        return (
          <ComprasTab
            compras={compras}
            inventario={inventario}
            funcionarios={funcionarios}
            adicionarCompra={adicionarCompra}
            removerCompra={removerCompra}
            atualizarCompra={atualizarCompra}
            readonly={isFuncionario}
          />
        );

      case TABS.DANIFICADAS:
        return (
          <FerramentasDanificadasTab
            ferramentasDanificadas={ferramentasDanificadas}
            inventario={inventario}
            adicionarFerramentaDanificada={adicionarFerramentaDanificada}
            atualizarFerramentaDanificada={atualizarFerramentaDanificada}
            removerFerramentaDanificada={removerFerramentaDanificada}
            readonly={isFuncionario}
          />
        );

      case TABS.PERDIDAS:
        return (
          <FerramentasPerdidasTab
            ferramentasPerdidas={ferramentasPerdidas}
            inventario={inventario}
            adicionarFerramentaPerdida={adicionarFerramentaPerdida}
            atualizarFerramentaPerdida={atualizarFerramentaPerdida}
            removerFerramentaPerdida={removerFerramentaPerdida}
            readonly={isFuncionario}
          />
        );

      case TABS.VERIFICACAO:
        return <VerificacaoMensalTab />;

      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-[#15202B] text-gray-900 dark:text-white min-h-screen">
      {/* Header com Tabs */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#192734]/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          {/* Navegação por Tabs - Desktop */}
          <div className="hidden md:flex items-center justify-start px-4 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = abaAtiva === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setAbaAtiva(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-6 py-4 font-medium text-sm
                    transition-all duration-200 whitespace-nowrap
                    ${isActive 
                      ? 'text-[#1D9BF0] dark:text-[#1D9BF0]' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className={`
                      ml-1 px-2 py-0.5 text-xs font-bold rounded-full
                      ${isActive 
                        ? 'bg-[#1D9BF0] text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }
                    `}>
                      {tab.badge}
                    </span>
                  )}
                  
                  {/* Indicador de aba ativa */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1D9BF0] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Navegação por Tabs - Mobile */}
          <div className="md:hidden flex overflow-x-auto px-2 py-2 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = abaAtiva === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setAbaAtiva(tab.id)}
                  className={`
                    relative flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-xl
                    transition-all duration-200 min-w-[80px]
                    ${isActive 
                      ? 'bg-[#1D9BF0]/10 text-[#1D9BF0] dark:bg-[#1D9BF0]/20' 
                      : 'bg-transparent text-gray-600 dark:text-gray-400'
                    }
                  `}
                >
                  <div className="relative">
                    <Icon className="w-6 h-6" />
                    {tab.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {tab.badge > 9 ? '9+' : tab.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo da Aba */}
      <div className="p-4 max-w-7xl mx-auto">
        {renderConteudoAba()}
      </div>
    </div>
  );
};

export default InventarioTab;

