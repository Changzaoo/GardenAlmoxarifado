import React, { useState, useContext, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { ToolCase, ArrowRight, Clock, Package, User, CheckCircle, CircleDotDashed } from 'lucide-react';
import { formatarData, formatarDataHora } from '../../utils/dateUtils';
import TransferirFerramenta from '../Transferencias/TransferirFerramenta';
import { FuncionariosContext } from '../Funcionarios/FuncionariosProvider';
import { db } from '../../firebaseConfig';

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
          <h3 className="text-lg font-semibold text-white mb-4">
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
                      className="px-4 py-2 text-sm bg-[#1DA1F2] text-white hover:bg-[#1a91da] rounded-lg transition-colors"
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
          <h3 className="text-lg font-semibold text-white mb-4">
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
          <div className="bg-[#192734] rounded-xl p-6 text-center border border-[#38444D]">
            <Package className="w-12 h-12 text-[#8899A6] mx-auto mb-3" />
            <p className="text-[#8899A6]">{showEmptyMessage}</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ToolCase className="w-6 h-6 text-[#1DA1F2]" />
              <h3 className="text-lg font-semibold text-white">
                Histórico de Empréstimos ({meusEmprestimosAtivos.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meusEmprestimosAtivos.map((emprestimo) => (
                <div
                  key={emprestimo.id}
                  className="bg-[#192734] rounded-xl p-6 border border-[#38444D] hover:border-[#1DA1F2] transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 text-white mb-1">
                        <ToolCase className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">
                          {emprestimo.ferramentas?.length} {emprestimo.ferramentas?.length === 1 ? 'Ferramenta' : 'Ferramentas'}
                        </h3>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-[#8899A6]">
                          <Clock className="w-4 h-4" />
                          <span>Retirada em {formatarDataHora(emprestimo.dataEmprestimo)}</span>
                        </div>
                        {emprestimo.status === 'devolvido' && (
                          <div className="flex items-center gap-2 text-sm text-[#8899A6]">
                            <CheckCircle className="w-4 h-4" />
                            <span>Devolvido em {formatarDataHora(emprestimo.dataDevolucao)}</span>
                          </div>
                        )}
                      </div>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                        emprestimo.status === 'devolvido'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      }`}>
                        {emprestimo.status === 'devolvido' ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Devolvido
                          </>
                        ) : (
                          <>
                            <Package className="w-3 h-3 mr-1" />
                            Em uso
                          </>
                        )}
                      </div>
                    </div>
                    {!readOnly && emprestimo.status !== 'devolvido' && (
                      <button
                        onClick={() => setTransferindoEmprestimo(emprestimo)}
                        className="text-[#1DA1F2] hover:text-[#1a91da] flex items-center gap-1 text-sm font-medium transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" /> Transferir
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      {emprestimo.ferramentas?.map((ferramenta, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-[#8899A6]">
                          <CircleDotDashed className="w-3 h-3" />
                          <span>
                            {ferramenta.nome || ferramenta}
                            {ferramenta.quantidade > 1 && (
                              <span className="text-[#8899A6]/70 ml-1">({ferramenta.quantidade} unidades)</span>
                            )}
                          </span>
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