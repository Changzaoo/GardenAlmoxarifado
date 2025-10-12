// VerificacaoMensalTab.jsx - Versão Melhorada com Visual Aprimorado

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  ClipboardList, 
  Calendar as CalendarIcon, 
  Trash2, 
  X, 
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Save,
  History,
  Package,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, orderBy, updateDoc } from 'firebase/firestore';
import HistoricoVerificacoes from './HistoricoVerificacoes';
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ToastProvider';
import { useSectorPermissions } from '../../hooks/useSectorPermissions';
import { PermissionChecker } from '../../constants/permissoes';

const VerificacaoMensalTab = () => {
  const [inventario, setInventario] = useState([]);
  const [verificacoes, setVerificacoes] = useState([]);
  const [mesAtual, setMesAtual] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [quantidades, setQuantidades] = useState({});
  const [itemParaRemover, setItemParaRemover] = useState(null);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [historicoVerificacoes, setHistoricoVerificacoes] = useState([]);
  const [quantidadesMesAnterior, setQuantidadesMesAnterior] = useState({});
  const [modalAberto, setModalAberto] = useState(false);
  const [emprestimosAtivos, setEmprestimosAtivos] = useState([]);
  
  const { usuario } = useAuth();
  const { showToast } = useToast();
  const { canViewAllSectors } = useSectorPermissions();
  const isAdmin = canViewAllSectors;

  // Filtrar inventário por setor
  const inventarioPorSetor = useMemo(() => {
    if (isAdmin) {
      return inventario;
    }
    return PermissionChecker.filterBySector(inventario, usuario);
  }, [inventario, usuario, isAdmin]);

  useEffect(() => {
    carregarDados();
  }, [mesAtual]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      await Promise.all([
        carregarInventario(),
        carregarEmprestimosAtivos(),
        carregarVerificacoes()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const carregarInventario = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'inventario'));
      const itens = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInventario(itens);
    } catch (error) {
      console.error('Erro ao carregar inventário:', error);
      throw error;
    }
  };

  const carregarEmprestimosAtivos = async () => {
    try {
      const q = query(
        collection(db, 'emprestimos'),
        where('status', '==', 'emprestado')
      );
      const querySnapshot = await getDocs(q);
      const emprestimos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmprestimosAtivos(emprestimos);
    } catch (error) {
      console.error('Erro ao carregar empréstimos:', error);
      throw error;
    }
  };

  const carregarVerificacoes = async () => {
    try {
      // Carregar verificações do mês atual
      const verificacoesRef = collection(db, 'verificacoes_mensais');
      const q = query(verificacoesRef, where('mes', '==', mesAtual));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const verificacao = querySnapshot.docs[0];
        const dados = verificacao.data();
        setVerificacoes([{ id: verificacao.id, ...dados }]);
        
        // Carregar quantidades da verificação
        const qtds = {};
        Object.keys(dados.itens || {}).forEach(itemId => {
          qtds[itemId] = dados.itens[itemId].quantidade;
        });
        setQuantidades(qtds);
      } else {
        setVerificacoes([]);
        // Inicializar quantidades com disponível atual
        const qtds = {};
        inventario.forEach(item => {
          qtds[item.id] = item.disponivel || 0;
        });
        setQuantidades(qtds);
      }

      // Carregar verificações do mês anterior
      const [ano, mes] = mesAtual.split('-');
      const mesAnterior = mes === '01' 
        ? `${parseInt(ano) - 1}-12`
        : `${ano}-${String(parseInt(mes) - 1).padStart(2, '0')}`;
      
      const qAnterior = query(verificacoesRef, where('mes', '==', mesAnterior));
      const snapshotAnterior = await getDocs(qAnterior);
      
      if (!snapshotAnterior.empty) {
        const verificacaoAnterior = snapshotAnterior.docs[0].data();
        setQuantidadesMesAnterior(verificacaoAnterior.itens || {});
      } else {
        setQuantidadesMesAnterior({});
      }
    } catch (error) {
      console.error('Erro ao carregar verificações:', error);
      throw error;
    }
  };

  const carregarHistorico = async () => {
    try {
      setLoading(true);
      const verificacoesRef = collection(db, 'verificacoes_mensais');
      const q = query(verificacoesRef, orderBy('mes', 'desc'));
      const querySnapshot = await getDocs(q);
      const todasVerificacoes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistoricoVerificacoes(todasVerificacoes);
      setMostrarHistorico(true);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      showToast('Erro ao carregar histórico.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantidadeChange = (id, valor) => {
    const valorNumerico = parseInt(valor) || 0;
    setQuantidades(prev => ({
      ...prev,
      [id]: valorNumerico
    }));
  };

  const salvarVerificacao = async () => {
    try {
      setLoading(true);
      
      const verificacaoData = {
        mes: mesAtual,
        dataVerificacao: new Date().toISOString(),
        responsavel: usuario.nome,
        itens: {}
      };

      // Adicionar dados de cada item
      inventarioPorSetor.forEach(item => {
        const quantidadeVerificada = quantidades[item.id] || 0;
        const quantidadeAnterior = quantidadesMesAnterior[item.id]?.quantidade || 0;
        const diferenca = quantidadeVerificada - quantidadeAnterior;
        
        verificacaoData.itens[item.id] = {
          nome: item.nome,
          quantidade: quantidadeVerificada,
          quantidadeAnterior,
          diferenca,
          setorId: item.setorId,
          setorNome: item.setorNome
        };
      });

      // Verificar se já existe uma verificação para este mês
      if (verificacoes.length > 0) {
        // Atualizar verificação existente
        await updateDoc(doc(db, 'verificacoes_mensais', verificacoes[0].id), verificacaoData);
        showToast('Verificação atualizada com sucesso!', 'success');
      } else {
        // Criar nova verificação
        await addDoc(collection(db, 'verificacoes_mensais'), verificacaoData);
        showToast('Verificação salva com sucesso!', 'success');
      }

      setModalAberto(false);
      await carregarVerificacoes();
    } catch (error) {
      console.error('Erro ao salvar verificação:', error);
      showToast('Erro ao salvar verificação. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calcularDiferenca = (itemId) => {
    const atual = quantidades[itemId] || 0;
    const anterior = quantidadesMesAnterior[itemId]?.quantidade || 0;
    return atual - anterior;
  };

  const getDiferencaIcon = (diferenca) => {
    if (diferenca > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (diferenca < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getDiferencaColor = (diferenca) => {
    if (diferenca > 0) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    if (diferenca < 0) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
  };

  const getEmprestimosDoItem = (itemNome) => {
    const nomeNormalizado = itemNome.trim().toLowerCase();
    return emprestimosAtivos.filter(emp => {
      return emp.ferramentas?.some(f => {
        const nome = typeof f === 'string' ? f : f.nome;
        return nome.trim().toLowerCase() === nomeNormalizado;
      });
    });
  };

  const calcularQuantidadeEmprestada = (itemNome) => {
    const nomeNormalizado = itemNome.trim().toLowerCase();
    let total = 0;
    
    emprestimosAtivos.forEach(emp => {
      emp.ferramentas?.forEach(f => {
        const nome = typeof f === 'string' ? f : f.nome;
        if (nome.trim().toLowerCase() === nomeNormalizado) {
          const quantidade = typeof f === 'string' ? 1 : (f.quantidade || 1);
          total += quantidade;
        }
      });
    });
    
    return total;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Badge informativo para não-admins */}
      {!isAdmin && usuario?.setor && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl px-4 py-3 flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Setor:</strong> {usuario.setor} - Visualizando apenas itens do seu setor
          </p>
        </div>
      )}

      {/* Header com controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-[#1D9BF0]" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Verificação Mensal
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={mesAtual}
            onChange={(e) => setMesAtual(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#1D9BF0] focus:border-transparent"
          />
          
          <button
            onClick={carregarHistorico}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Ver histórico"
          >
            <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <Button
            onClick={() => setModalAberto(true)}
            className="bg-[#1D9BF0] hover:bg-[#1a8cd8] text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <ClipboardList className="w-5 h-5" />
            Nova Verificação
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Itens</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {inventarioPorSetor.length}
              </p>
            </div>
            <Package className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Emprestados</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {emprestimosAtivos.length}
              </p>
            </div>
            <ClipboardList className="w-12 h-12 text-orange-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Verificações</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {verificacoes.length}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Tabela de inventário */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Mês Anterior
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Disponível
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Emprestado
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Atual
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Diferença
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {inventarioPorSetor
                .sort((a, b) => a.nome.localeCompare(b.nome))
                .map((item) => {
                  const quantidadeAnterior = quantidadesMesAnterior[item.id]?.quantidade || 0;
                  const quantidadeAtual = quantidades[item.id] || item.disponivel || 0;
                  const quantidadeEmprestada = calcularQuantidadeEmprestada(item.nome);
                  const diferenca = quantidadeAtual - quantidadeAnterior;
                  const emprestimosDoItem = getEmprestimosDoItem(item.nome);

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {item.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {item.nome}
                            </p>
                            {item.setorNome && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {item.setorNome}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {quantidadeAnterior}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          {item.disponivel || 0}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            quantidadeEmprestada > 0 
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            {quantidadeEmprestada}
                          </span>
                          {emprestimosDoItem.length > 0 && (
                            <span 
                              className="text-xs text-gray-500 dark:text-gray-400 cursor-help"
                              title={`${emprestimosDoItem.length} empréstimo(s) ativo(s)`}
                            >
                              ({emprestimosDoItem.length})
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          min="0"
                          value={quantidadeAtual}
                          onChange={(e) => handleQuantidadeChange(item.id, e.target.value)}
                          className="w-20 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-center text-gray-900 dark:text-white focus:ring-2 focus:ring-[#1D9BF0] focus:border-transparent"
                        />
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getDiferencaIcon(diferenca)}
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getDiferencaColor(diferenca)}`}>
                            {diferenca > 0 ? '+' : ''}{diferenca}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmação de salvamento */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#1D9BF0]/10 flex items-center justify-center">
                    <Save className="w-6 h-6 text-[#1D9BF0]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Salvar Verificação
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Confirme os dados antes de salvar
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalAberto(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Você está prestes a salvar a verificação mensal de <strong>{new Date(mesAtual + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong>.
              </p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total de itens</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{inventarioPorSetor.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Responsável</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{usuario.nome}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Data</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {new Date().toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Esta ação salvará as quantidades atuais e criará um registro histórico da verificação.
              </p>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
              <button
                onClick={() => setModalAberto(false)}
                disabled={loading}
                className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={salvarVerificacao}
                disabled={loading}
                className="px-6 py-2.5 bg-[#1D9BF0] hover:bg-[#1a8cd8] text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Verificação
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de histórico */}
      {mostrarHistorico && (
        <HistoricoVerificacoes
          verificacoes={historicoVerificacoes}
          onClose={() => setMostrarHistorico(false)}
        />
      )}

      {/* Modal de confirmação de remoção */}
      {itemParaRemover && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Confirmar Remoção
                </h3>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Tem certeza que deseja remover <strong>{itemParaRemover.nome}</strong>? 
                Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setItemParaRemover(null)}
                  className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    try {
                      await deleteDoc(doc(db, 'inventario', itemParaRemover.id));
                      setInventario(prev => prev.filter(item => item.id !== itemParaRemover.id));
                      showToast('Item removido com sucesso!', 'success');
                      setItemParaRemover(null);
                    } catch (error) {
                      console.error('Erro ao remover item:', error);
                      showToast('Erro ao remover item.', 'error');
                    }
                  }}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificacaoMensalTab;
