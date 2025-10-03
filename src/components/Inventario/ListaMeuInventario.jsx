import React, { useState, useContext, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { ToolCase, ArrowRight, Clock, Package, User, CheckCircle, CircleDotDashed } from 'lucide-react';
import { formatarData, formatarDataHora } from '../../utils/dateUtils';
import TransferirFerramenta from '../Transferencias/TransferirFerramenta';
import { FuncionariosContext } from '../Funcionarios/FuncionariosProvider';
import { db } from '../../firebaseConfig';
import BotaoExtratoPDF from '../Emprestimos/BotaoExtratoPDF';

const ListaMeuInventario = ({ emprestimos, usuario, showEmptyMessage = 'Nenhum empréstimo encontrado', readOnly = false }) => {
  const [transferindoEmprestimo, setTransferindoEmprestimo] = useState(null);
  const [transferenciasRecebimento, setTransferenciasRecebimento] = useState([]);
  const [transferenciasEnvio, setTransferenciasEnvio] = useState([]);
  const { funcionarios } = useContext(FuncionariosContext);

  // Garantir que emprestimos seja sempre um array
  const emprestimosArray = Array.isArray(emprestimos) ? emprestimos : [];

  // Efeito para buscar transferências
  useEffect(() => {
    if (!usuario?.id) return;

    // Query para transferências que o usuário está recebendo
    const qRecebendo = query(
      collection(db, 'transferencias'),
      where('funcionarioDestinoId', '==', String(usuario.id)),
      where('status', '==', 'pendente')
    );

    // Query para transferências que o usuário está enviando
    const qEnviando = query(
      collection(db, 'transferencias'),
      where('funcionarioOrigemId', '==', String(usuario.id)),
      where('status', '==', 'pendente')
    );

    // Ouvir transferências recebidas
    const unsubscribeRecebendo = onSnapshot(qRecebendo, (snapshot) => {
      const transferencias = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransferenciasRecebimento(transferencias);
    });

    // Ouvir transferências enviadas
    const unsubscribeEnviando = onSnapshot(qEnviando, (snapshot) => {
      const transferencias = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransferenciasEnvio(transferencias);
    });

    return () => {
      unsubscribeRecebendo();
      unsubscribeEnviando();
    };
  }, [usuario?.id]);

  const handleAceitarTransferencia = async (transferencia) => {
    try {
      const docRef = doc(db, 'transferencias', transferencia.id);
      await updateDoc(docRef, {
        status: 'aceito',
        dataAceite: new Date().toISOString()
      });
      
      if (transferencia.emprestimoId) {
        const emprestimoRef = doc(db, 'emprestimos', transferencia.emprestimoId);
        await updateDoc(emprestimoRef, {
          funcionarioId: String(usuario.id),
          colaborador: usuario.nome
        });
      }
    } catch (error) {
      console.error('Erro ao aceitar transferência:', error);
    }
  };

  const handleRecusarTransferencia = async (transferencia) => {
    try {
      const docRef = doc(db, 'transferencias', transferencia.id);
      await updateDoc(docRef, {
        status: 'recusado',
        dataRecusa: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao recusar transferência:', error);
    }
  };

  // Filtrar empréstimos
  const meusEmprestimosAtivos = emprestimosArray
    .sort((a, b) => {
      const dataA = new Date(a.dataEmprestimo);
      const dataB = new Date(b.dataEmprestimo);
      return dataB - dataA;
    });

  return (
    <div className="space-y-6">
      {/* Seção de Transferências para Receber */}
      {transferenciasRecebimento.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Transferências Aguardando Sua Aprovação ({transferenciasRecebimento.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {transferenciasRecebimento.map((transferencia) => (
              <div key={transferencia.id} className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        De: {transferencia.funcionarioOrigem}
                      </h4>
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Aguardando aprovação
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ferramentas:</h4>
                    <div className="space-y-1">
                      {(transferencia.ferramentas || []).map((ferramenta, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                          <CircleDotDashed className="w-3 h-3" />
                          <span>
                            {typeof ferramenta === 'string' ? ferramenta : ferramenta?.nome || 'Ferramenta sem nome'}
                            {ferramenta?.quantidade > 1 && (
                              <span className="text-gray-500 dark:text-gray-400 ml-1">({ferramenta.quantidade} unidades)</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleRecusarTransferencia(transferencia)}
                      className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      Recusar
                    </button>
                    <button
                      onClick={() => handleAceitarTransferencia(transferencia)}
                      className="px-4 py-2 text-sm bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white hover:bg-blue-600 dark:hover:bg-[#1a8cd8] rounded-lg transition-colors"
                    >
                      Aceitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seção de Transferências Enviadas */}
      {transferenciasEnvio.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Transferências Enviadas ({transferenciasEnvio.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {transferenciasEnvio.map((transferencia) => (
              <div key={transferencia.id} className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        Para: {transferencia.funcionarioDestino}
                      </h4>
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Aguardando confirmação
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ferramentas:</h4>
                    <div className="space-y-1">
                      {(transferencia.ferramentas || []).map((ferramenta, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                          <CircleDotDashed className="w-3 h-3" />
                          <span>
                            {typeof ferramenta === 'string' ? ferramenta : ferramenta?.nome || 'Ferramenta sem nome'}
                            {ferramenta?.quantidade > 1 && (
                              <span className="text-gray-500 dark:text-gray-400 ml-1">({ferramenta.quantidade} unidades)</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {transferencia.dataSolicitacao && `Enviado em ${formatarDataHora(transferencia.dataSolicitacao)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seção de Empréstimos */}
      <div>
        {meusEmprestimosAtivos.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-600 dark:border-gray-600">
            <Package className="w-12 h-12 text-gray-500 dark:text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">{showEmptyMessage}</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ToolCase className="w-6 h-6 text-blue-500 dark:text-[#1D9BF0]" />
              <h3 className="text-lg font-semibold text-white">
                Histórico de Empréstimos ({meusEmprestimosAtivos.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meusEmprestimosAtivos.map((emprestimo) => (
                <div
                  key={emprestimo.id}
                  className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-gray-100 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl overflow-hidden group"
                >
                  {/* Gradiente decorativo de fundo */}
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-30 ${
                    emprestimo.status === 'devolvido' 
                      ? 'bg-green-500' 
                      : 'bg-blue-500'
                  }`}></div>
                  
                  {/* Header do Card */}
                  <div className="relative flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-3 rounded-xl ${
                          emprestimo.status === 'devolvido' 
                            ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                            : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                        } shadow-lg`}>
                          <ToolCase className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {emprestimo.ferramentas?.length} {emprestimo.ferramentas?.length === 1 ? 'Ferramenta' : 'Ferramentas'}
                          </h3>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                            emprestimo.status === 'devolvido'
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md shadow-green-500/30'
                              : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/30'
                          }`}>
                            {emprestimo.status === 'devolvido' ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                Devolvido
                              </>
                            ) : (
                              <>
                                <Package className="w-3.5 h-3.5 mr-1" />
                                Em uso
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Botão Extrato PDF - Sempre visível */}
                      <BotaoExtratoPDF 
                        emprestimo={emprestimo} 
                        variant="button" 
                        size="sm"
                      />

                      {!readOnly && emprestimo.status !== 'devolvido' && (
                        <button
                          onClick={() => setTransferindoEmprestimo(emprestimo)}
                          className="relative z-10 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          <ArrowRight className="w-4 h-4" />
                          Transferir
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Datas e Informações */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-medium">Retirada em</span>
                      <span className="text-gray-900 dark:text-white font-semibold">{formatarDataHora(emprestimo.dataEmprestimo)}</span>
                    </div>
                    {emprestimo.status === 'devolvido' && (
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="font-medium">Devolvido em</span>
                        <span className="text-gray-900 dark:text-white font-semibold">{formatarDataHora(emprestimo.dataDevolucao)}</span>
                      </div>
                    )}
                  </div>

                  {/* Lista de Ferramentas */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ferramentas:</h4>
                    <div className="space-y-2">
                      {emprestimo.ferramentas?.map((ferramenta, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="bg-gray-100 dark:bg-gray-600 p-2 rounded-lg">
                            <CircleDotDashed className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">
                            {ferramenta.nome || ferramenta}
                          </span>
                          {ferramenta.quantidade > 1 && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg">
                              {ferramenta.quantidade}x
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Transferência */}
      {transferindoEmprestimo && (
        <TransferirFerramenta
          emprestimo={transferindoEmprestimo}
          onClose={() => setTransferindoEmprestimo(null)}
        />
      )}
    </div>
  );
};

export default ListaMeuInventario;


