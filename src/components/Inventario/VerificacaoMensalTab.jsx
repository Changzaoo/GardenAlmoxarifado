import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, AlertCircle, ClipboardList, Calendar as CalendarIcon, Trash2, X } from 'lucide-react';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import HistoricoVerificacoes from './HistoricoVerificacoes';
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ToastProvider';
import FullscreenPrompt from '../FullscreenPrompt';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const VerificacaoMensalTab = () => {
  // ... states and hooks ...
  const renderModal = () => {
    if (!modalAberto) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Verificação do Inventário</h3>
            <button
              onClick={() => setModalAberto(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {inventario.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{item.nome}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Quantidade anterior: {quantidadesMesAnterior[item.id] || item.quantidade}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="0"
                      value={quantidades[item.id] || ''}
                      onChange={(e) => handleQuantidadeChange(item.id, e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                      placeholder="Qtd."
                    />
                    <button
                      onClick={() => setItemParaRemover(item)}
                      className="text-red-500 hover:text-red-600 p-1"
                      title="Remover item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              onClick={() => setModalAberto(false)}
              variant="secondary"
              className="text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                salvarVerificacao();
                setModalAberto(false);
              }}
              variant="primary"
              className="bg-[#1DA1F2] hover:bg-[#1a91da] text-white"
              loading={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Verificação'}
            </Button>
          </div>
        </div>
      </div>
    );
  };
  const [inventario, setInventario] = useLocalStorage('verificacao-mensal-inventario', []);
  const [verificacoes, setVerificacoes] = useLocalStorage('verificacao-mensal-verificacoes', []);
  const [mesAtual, setMesAtual] = useLocalStorage('verificacao-mensal-mes-atual', new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [quantidades, setQuantidades] = useLocalStorage('verificacao-mensal-quantidades', {});
  const [itemParaRemover, setItemParaRemover] = useState(null);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [historicoVerificacoes, setHistoricoVerificacoes] = useState([]);
  const [quantidadesMesAnterior, setQuantidadesMesAnterior] = useState({});
  const [modalAberto, setModalAberto] = useState(false);
  const { usuario } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    carregarInventario();
    carregarVerificacoes();
  }, [mesAtual]);

  const carregarHistorico = async () => {
    try {
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
      showToast('Erro ao carregar histórico. Verifique sua conexão.', 'error');
    }
  };

  const carregarInventario = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'inventario'));
      const itens = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        verificado: false,
        observacao: ''
      }));
      
      // Mescla os dados do Firestore com as quantidades persistidas localmente
      const itensComQuantidades = itens.map(item => {
        const quantidadeLocal = quantidades[item.id];
        return {
          ...item,
          quantidade: quantidadeLocal !== undefined ? quantidadeLocal : ''
        };
      });
      
      setInventario(itensComQuantidades);
    } catch (error) {
      console.error('Erro ao carregar inventário:', error);
      showToast('Erro ao carregar inventário. Verifique sua conexão.', 'error');
    }
  };

  const carregarVerificacoes = async () => {
    try {
      // Carregar verificações do mês atual
      const verificacoesRef = collection(db, 'verificacoes_mensais');
      const q = query(verificacoesRef, where('mes', '==', mesAtual));
      const querySnapshot = await getDocs(q);
      const verificacoesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVerificacoes(verificacoesData);

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

      // Atualizar o estado dos itens verificados preservando as quantidades locais
      if (verificacoesData.length > 0) {
        const verificacao = verificacoesData[0];
        setInventario(prev => prev.map(item => ({
          ...item,
          verificado: verificacao.itens[item.id]?.verificado || false,
          observacao: verificacao.itens[item.id]?.observacao || '',
          quantidade: quantidades[item.id] || item.quantidade || ''
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar verificações:', error);
      showToast('Erro ao carregar verificações. Verifique sua conexão.', 'error');
    }
  };

  const handleQuantidadeChange = (id, valor) => {
    setQuantidades(prev => ({
      ...prev,
      [id]: valor
    }));
  };

  const handleRemoverItem = (id) => {
    const item = inventario.find(item => item.id === id);
    if (item) {
      setItemParaRemover(item);
    }
  };

  const confirmarRemocao = async () => {
    if (!itemParaRemover) return;

    try {
      // Remove do Firestore
      const itemRef = doc(db, 'inventario', itemParaRemover.id);
      await deleteDoc(itemRef);

      // Atualiza o estado local
      setInventario(prev => prev.filter(item => item.id !== itemParaRemover.id));
      setQuantidades(prev => {
        const { [itemParaRemover.id]: removed, ...rest } = prev;
        return rest;
      });

      showToast('Item removido com sucesso do inventário.', 'success');
    } catch (error) {
      console.error('Erro ao remover item:', error);
      showToast('Erro ao remover item. Tente novamente.', 'error');
    } finally {
      setItemParaRemover(null);
    }
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

      inventario.forEach(item => {
        verificacaoData.itens[item.id] = {
          quantidade: quantidades[item.id] || 0
        };
      });

      // Verificar se já existe uma verificação para este mês
      if (verificacoes.length > 0) {
        // Atualizar verificação existente
        // TODO: Implementar atualização se necessário
      } else {
        // Criar nova verificação
        await addDoc(collection(db, 'verificacoes_mensais'), verificacaoData);
      }

      showToast('Verificação mensal salva com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar verificação:', error);
      showToast('Erro ao salvar verificação. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (item) => {
    if (!item.verificado) return null;
    return item.quantidade === item.disponivel ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      {itemParaRemover && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirmar Remoção</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Tem certeza que deseja remover o item "{itemParaRemover.nome}"? Ele será excluído permanentemente do inventário.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setItemParaRemover(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRemocao}
                className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={mesAtual}
            onChange={(e) => setMesAtual(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
          />
          <button
            onClick={carregarHistorico}
            className="hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
            title="Ver histórico de verificações"
          >
            <CalendarIcon className="w-5 h-5 text-[#1DA1F2]" />
          </button>
        </div>
        <Button
          variant="primary"
          className="bg-[#1DA1F2] hover:bg-[#1a91da] text-white px-4 py-2 rounded-lg transition-colors"
          onClick={() => setModalAberto(true)}
        >
          Verificar Inventário
        </Button>
      </div>

      {/* Modal de Verificação */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Verificação do Inventário</h3>
              <button
                onClick={() => setModalAberto(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {inventario.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{item.nome}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Quantidade anterior: {quantidadesMesAnterior[item.id] || item.quantidade}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        min="0"
                        value={quantidades[item.id] || ''}
                        onChange={(e) => handleQuantidadeChange(item.id, e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                        placeholder="Qtd."
                      />
                      <button
                        onClick={() => setItemParaRemover(item)}
                        className="text-red-500 hover:text-red-600 p-1"
                        title="Remover item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </Button>
              <Button
                onClick={salvarVerificacao}
                className="bg-[#1DA1F2] hover:bg-[#1a91da] text-white px-4 py-2 rounded-lg transition-colors"
              >
                Salvar Verificação
              </Button>
            </div>
          </div>
        </div>
      )}

      {mostrarHistorico && (
        <HistoricoVerificacoes
          verificacoes={historicoVerificacoes}
          onClose={() => setMostrarHistorico(false)}
        />
      )}

      {itemParaRemover && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirmar Remoção</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Tem certeza que deseja remover o item "{itemParaRemover.nome}"?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setItemParaRemover(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRemocao}
                className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
      
      {renderModal()}
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-x-auto">
        <div className="min-w-max">
          <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-48">
                Ferramenta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                Quantidade Mês Anterior
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                Quantidade no Mês
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-40">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {[...inventario].sort((a, b) => a.nome.localeCompare(b.nome)).map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {item.nome}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {quantidadesMesAnterior[item.id]?.quantidade || '0'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={quantidades[item.id] || ''}
                      onChange={(e) => handleQuantidadeChange(item.id, e.target.value)}
                      placeholder="Quantidade"
                      className="w-24 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1"
                      min="0"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center space-x-2 justify-center">
                    <button
                      onClick={() => handleRemoverItem(item.id)}
                      className="p-2 text-red-500 hover:text-red-600 transition-colors"
                      title="Remover item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default VerificacaoMensalTab;