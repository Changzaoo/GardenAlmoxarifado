import React, { useState, useContext, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { ToolCase, ArrowRight, Clock } from 'lucide-react';
import { formatarData } from '../../utils/dateUtils';
import TransferirFerramenta from '../Transferencias/TransferirFerramenta';
import { FuncionariosContext } from '../Funcionarios/FuncionariosProvider';
import { db } from '../../firebaseConfig';

const ListaMeuInventario = ({ emprestimos, usuario }) => {
  const [transferindoEmprestimo, setTransferindoEmprestimo] = useState(null);
  const [transferenciasRecebimento, setTransferenciasRecebimento] = useState([]);
  const [transferenciasEnvio, setTransferenciasEnvio] = useState([]);
  const { funcionarios } = useContext(FuncionariosContext);

  // Garantir que emprestimos seja sempre um array
  const emprestimosArray = Array.isArray(emprestimos) ? emprestimos : [];

  // Efeito para buscar transferências
  useEffect(() => {
    if (!usuario?.id) return;

    console.log('Configurando listeners para usuário ID:', usuario.id);

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
      const transferencias = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Transferência recebida encontrada:', {
          id: doc.id,
          funcionarioDestinoId: data.funcionarioDestinoId,
          funcionarioOrigemId: data.funcionarioOrigemId,
          status: data.status,
          ferramentas: data.ferramentas
        });
        return {
          id: doc.id,
          ...data
        };
      });
      console.log('Total de transferências para receber:', transferencias.length);
      setTransferenciasRecebimento(transferencias);
    });

    // Ouvir transferências enviadas
    const unsubscribeEnviando = onSnapshot(qEnviando, (snapshot) => {
      const transferencias = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Transferência enviada encontrada:', {
          id: doc.id,
          funcionarioDestinoId: data.funcionarioDestinoId,
          funcionarioOrigemId: data.funcionarioOrigemId,
          status: data.status,
          ferramentas: data.ferramentas
        });
        return {
          id: doc.id,
          ...data
        };
      });
      console.log('Total de transferências enviadas:', transferencias.length);
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
      console.log('Transferência aceita com sucesso');
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
      console.log('Transferência recusada com sucesso');
    } catch (error) {
      console.error('Erro ao recusar transferência:', error);
    }
  };

  // Filtrar empréstimos ativos
  const meusEmprestimosAtivos = emprestimosArray
    .filter(emp => {
      const mesmoId = emp.funcionarioId === usuario?.id;
      const mesmoUsuario = emp.colaborador?.toLowerCase() === usuario?.nome?.toLowerCase();
      const statusAtivo = emp.status === 'ativo' || !emp.dataDevolucao;
      return (mesmoId || mesmoUsuario) && statusAtivo;
    })
    .sort((a, b) => {
      const dataA = new Date(a.dataRetirada + 'T' + (a.horaRetirada || '00:00'));
      const dataB = new Date(b.dataRetirada + 'T' + (b.horaRetirada || '00:00'));
      return dataB - dataA;
    });

  // Calcular tempo de empréstimo
  const calcularTempoEmprestimo = (emprestimo) => {
    if (!emprestimo) return 'Data indisponível';
    
    try {
      // Se houver data de última transferência, usa ela diretamente pois já é ISO
      let dataBase = emprestimo.dataUltimaTransferencia;
      
      if (!dataBase) {
        // Se não houver transferência, usa a data de retirada
        if (!emprestimo.dataRetirada) return 'Data indisponível';
        
        // Adiciona T00:00:00Z se não houver hora especificada
        if (emprestimo.horaRetirada) {
          // Formata a hora para garantir o formato correto HH:mm
          const hora = emprestimo.horaRetirada.split(':').slice(0, 2).join(':');
          dataBase = `${emprestimo.dataRetirada}T${hora}:00Z`;
        } else {
          dataBase = `${emprestimo.dataRetirada}T00:00:00Z`;
        }
      }

      console.log('Data base para cálculo:', dataBase); // Para debug
      
      const dataHora = new Date(dataBase);
      if (isNaN(dataHora.getTime())) {
        console.error('Data inválida após parse:', dataBase);
        return 'Data inválida';
      }

      const agora = new Date();
      const diferenca = agora - dataHora;
      const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
      
      if (dias === 0) return 'Hoje';
      if (dias === 1) return 'Há 1 dia';
      return `Há ${dias} dias`;
    } catch (error) {
      console.error('Erro ao calcular tempo:', error);
      return 'Erro no cálculo';
    }
  };

  return (
    <div className="space-y-6">
      {/* Debug - Mostrar sempre para teste */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4 text-sm">

        {transferenciasRecebimento.length > 0 && (
          <pre className="mt-2 text-xs">
            {JSON.stringify(transferenciasRecebimento[0], null, 2)}
          </pre>
        )}
      </div>

      {/* Seção de Transferências para Receber */}
      {transferenciasRecebimento.length > 0 && (
        <div className="bg-green-50 rounded-lg shadow-sm p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-4">
            Transferências Aguardando Sua Aprovação ({transferenciasRecebimento.length})
          </h3>
          <div className="space-y-4">
            {transferenciasRecebimento.map((transferencia) => (
              <div key={transferencia.id} className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      De: {transferencia.funcionarioOrigem || transferencia.nomeOrigemFuncionario || 'Não identificado'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Solicitado em: {transferencia.dataSolicitacao ? formatarData(transferencia.dataSolicitacao) : 'Data não informada'}
                    </p>
                    {transferencia.observacoes && (
                      <p className="text-sm text-gray-600 mt-1">
                        Observações: {transferencia.observacoes}
                      </p>
                    )}
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">Ferramentas:</p>
                      <ul className="mt-1 space-y-1">
                        {(transferencia.ferramentas || []).map((ferramenta, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <ToolCase className="w-4 h-4" />
                            {typeof ferramenta === 'string' ? ferramenta : ferramenta?.nome || 'Ferramenta sem nome'}
                            {ferramenta?.quantidade && ferramenta.quantidade > 1 && ` (${ferramenta.quantidade})`}
                            {ferramenta?.codigo && (
                              <span className="text-xs text-gray-500">- {ferramenta.codigo}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Aguardando sua aprovação
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAceitarTransferencia(transferencia)}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => handleRecusarTransferencia(transferencia)}
                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seção de Transferências Enviadas */}
      {transferenciasEnvio.length > 0 && (
        <div className="bg-orange-50 rounded-lg shadow-sm p-6 border border-orange-200">
          <h3 className="text-lg font-semibold text-orange-800 mb-4">
            Transferências Enviadas Pendentes ({transferenciasEnvio.length})
          </h3>
          <div className="space-y-4">
            {transferenciasEnvio.map((transferencia) => (
              <div key={transferencia.id} className="bg-white rounded-lg p-4 border border-orange-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      Para: {transferencia.funcionarioDestino}
                    </p>
                    <p className="text-sm text-gray-600">
                      Enviado em: {formatarData(transferencia.dataSolicitacao)}
                    </p>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">Ferramentas:</p>
                      <ul className="mt-1 space-y-1">
                        {(transferencia.ferramentas || []).map((ferramenta, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <ToolCase className="w-4 h-4" />
                            {typeof ferramenta === 'string' ? ferramenta : ferramenta?.nome || 'Ferramenta sem nome'}
                            {ferramenta?.quantidade > 1 && ` (${ferramenta.quantidade})`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <span className="text-sm text-orange-600 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Aguardando aprovação
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Transferência */}
      {transferindoEmprestimo && (
        <TransferirFerramenta
          emprestimo={transferindoEmprestimo}
          funcionarios={funcionarios || []}
          onClose={() => setTransferindoEmprestimo(null)}
        />
      )}

      {/* Lista de Empréstimos */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Minhas Ferramentas</h2>
            <p className="text-sm text-gray-600">
              Total de empréstimos ativos: {meusEmprestimosAtivos.length}
            </p>
          </div>
          <div className="flex gap-4">
            {(transferenciasRecebimento.length > 0 || transferenciasEnvio.length > 0) && (
              <div className="px-4 py-2 bg-orange-50 text-orange-800 rounded-lg text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {transferenciasRecebimento.length > 0 && (
                  <span>{transferenciasRecebimento.length} para aprovar</span>
                )}
                {transferenciasRecebimento.length > 0 && transferenciasEnvio.length > 0 && " • "}
                {transferenciasEnvio.length > 0 && (
                  <span>{transferenciasEnvio.length} enviadas</span>
                )}
              </div>
            )}
            <div className="px-4 py-2 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
              Você possui {meusEmprestimosAtivos.reduce((acc, emp) => acc + ((emp.ferramentas || []).length), 0)} ferramenta(s) em sua posse
            </div>
          </div>
        </div>

        {meusEmprestimosAtivos.length === 0 ? (
          <div className="text-center py-8">
            <ToolCase className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">Você não possui ferramentas em sua posse no momento.</p>
            {transferenciasRecebimento.length > 0 && (
              <p className="text-sm text-green-600 mt-2">
                Você tem {transferenciasRecebimento.length} transferência(s) pendente(s) para aprovação.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {meusEmprestimosAtivos.map((emp) => (
              <div key={emp.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium text-gray-900 mb-1">
                      Empréstimo #{emp.id?.slice(-4) || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {emp.dataUltimaTransferencia ? (
                        <>
                          Transferido em: {formatarData(emp.dataUltimaTransferencia)}
                          <br />
                          <span className="text-xs text-gray-500">
                            Retirada original: {formatarData(emp.dataRetirada)} às {emp.horaRetirada || '00:00'}
                          </span>
                        </>
                      ) : (
                        <>Retirada: {formatarData(emp.dataRetirada)} às {emp.horaRetirada || '00:00'}</>
                      )}
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {calcularTempoEmprestimo(emp)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {(emp.ferramentas || []).map((ferramenta, idx) => (
                    <div 
                      key={`${emp.id}-${idx}`}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ToolCase className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-gray-900">
                            {typeof ferramenta === 'string' ? ferramenta : ferramenta?.nome || 'Ferramenta sem nome'}
                          </span>
                          {ferramenta?.codigo && (
                            <span className="ml-2 text-sm text-gray-500">
                              Código: {ferramenta.codigo}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {emp.previsaoDevolucao && (
                          <span className="text-xs text-orange-600">
                            Devolução prevista: {formatarData(emp.previsaoDevolucao)}
                          </span>
                        )}
                        <button
                          onClick={() => {
                            const emprestimoParaTransferir = {
                              ...emp,
                              funcionarioId: String(usuario?.id || ''),
                              ferramentas: [ferramenta]
                            };
                            setTransferindoEmprestimo(emprestimoParaTransferir);
                          }}
                          className="px-2 py-1 rounded flex items-center gap-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                          <ArrowRight className="w-4 h-4" />
                          Transferir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListaMeuInventario;