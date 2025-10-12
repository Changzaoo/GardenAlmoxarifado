import React, { useState, useEffect } from 'react';
import { collection, query, where, updateDoc, doc, onSnapshot, addDoc, getDoc, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { db } from '../../firebaseConfig';
import { formatarData } from '../../utils/dateUtils';
import { ArrowRight, CheckCircle, XCircle, Bell } from 'lucide-react';
import { useEmprestimos } from '../../hooks/useEmprestimos';

const TransferenciasRecebidas = ({ usuario }) => {
  const [transferencias, setTransferencias] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { adicionarEmprestimo } = useEmprestimos();

  useEffect(() => {
    let unsubscribe = () => {};

    const fetchTransferencias = async () => {
      try {
        if (!usuario?.id) {
          setIsLoading(false);
          return;
        }

        const usuarioId = String(usuario.id);
        const q = query(
          collection(db, 'transferencias'),
          where('funcionarioDestinoId', '==', usuarioId),
          where('status', '==', 'pendente')
        );

        unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const transferenciasData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            setTransferencias(transferenciasData);
            setError(null);
            setIsLoading(false);
          },
          (error) => {
            console.error('Erro ao buscar transferências:', error);
            setError('Erro ao carregar transferências. Por favor, recarregue a página.');
            setIsLoading(false);
          }
        );
      } catch (error) {
        console.error('Erro na configuração do listener:', error);
        setError('Erro ao configurar o monitoramento de transferências.');
        setIsLoading(false);
      }
    };

    fetchTransferencias();
    return () => unsubscribe();
  }, [usuario]);

  const handleAcao = async (transferencia, aceitar) => {
    try {
      const transferenciaRef = doc(db, 'transferencias', transferencia.id);
      const emprestimoRef = doc(db, 'emprestimos', transferencia.emprestimoId);

      if (aceitar) {
        const dataAtual = new Date().toISOString();
        const horaAtual = new Date().toLocaleTimeString();

        // Criar novo empréstimo para as ferramentas transferidas
        const novoEmprestimo = {
          colaborador: transferencia.funcionarioDestino,
          funcionarioId: transferencia.funcionarioDestinoId,
          ferramentas: transferencia.ferramentas.map(f => 
            typeof f === 'string' ? f : {
              ...f,
              status: 'ativo'  // Garantir que a ferramenta está ativa
            }
          ),
          dataRetirada: dataAtual,
          horaRetirada: horaAtual,
          status: 'ativo',
          observacoes: `Transferido de ${transferencia.funcionarioOrigem} em ${formatarData(dataAtual)}`,
          emprestimoOriginalId: transferencia.emprestimoId,
          transferidoDe: {
            funcionarioId: transferencia.funcionarioOrigemId,
            nome: transferencia.funcionarioOrigem,
            data: dataAtual
          }
        };

        // Usar o hook para adicionar o empréstimo
        const novoEmprestimoComId = await adicionarEmprestimo(novoEmprestimo);

        // Obter e atualizar o empréstimo original
        const emprestimoOriginalSnap = await getDoc(emprestimoRef);
        if (emprestimoOriginalSnap.exists()) {
          const emprestimoOriginal = emprestimoOriginalSnap.data();
          
          // Remover as ferramentas transferidas do empréstimo original
          const ferramentasRestantes = emprestimoOriginal.ferramentas.filter(
            f => !transferencia.ferramentas.some(tf => 
              (typeof tf === 'string' && tf === f) ||
              (typeof tf === 'object' && tf.id === f.id)
            )
          );
          
          // Se não sobrarem ferramentas, finalizar o empréstimo
          if (ferramentasRestantes.length === 0) {

            await updateDoc(emprestimoRef, {
              status: 'finalizado',
              dataFinalizacao: dataAtual,
              motivoFinalizacao: 'Todas as ferramentas foram transferidas',
              ferramentas: [] // Limpar array de ferramentas
            });
          } else {

            await updateDoc(emprestimoRef, {
              ferramentas: ferramentasRestantes,
              observacoes: `${emprestimoOriginal.observacoes || ''}\nFerramentas transferidas para ${transferencia.funcionarioDestino} em ${formatarData(new Date())}`
            });
          }
        }
      }

      // Atualizar status da transferência
      await updateDoc(transferenciaRef, {
        status: aceitar ? 'aceita' : 'recusada',
        dataProcessamento: new Date().toISOString(),
        historico: [...(transferencia.historico || []), {
          status: aceitar ? 'aceita' : 'recusada',
          data: new Date().toISOString(),
          acao: aceitar ? 'Transferência aceita' : 'Transferência recusada',
          usuario: usuario.nome
        }]
      });

      // Atualizar lista local
      setTransferencias(prev => prev.filter(t => t.id !== transferencia.id));

      toast.success(aceitar ? 'Transferência aceita com sucesso!' : 'Transferência recusada');

    } catch (error) {
      console.error('Erro ao processar transferência:', error);
      toast.error('Erro ao processar transferência: ' + error.message);
    }
  };

  if (!usuario?.id) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 dark:border-white"></div>
          <p className="text-gray-900 dark:text-white">Carregando transferências...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (transferencias.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-600">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-yellow-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ferramentas para Aceitar</h2>
        <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-800 text-sm rounded-full">
          {transferencias.length}
        </span>
      </div>

      <div className="space-y-4">
        {transferencias.map((transferencia) => (
          <div
            key={transferencia.id}
            className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
          >
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    De: {transferencia.funcionarioOrigem}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Solicitado em: {formatarData(transferencia.dataSolicitacao)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcao(transferencia, true)}
                    className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aceitar
                  </button>
                  <button
                    onClick={() => handleAcao(transferencia, false)}
                    className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Recusar
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-600 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Ferramentas:</p>
                <ul className="space-y-1">
                  {(transferencia.ferramentas || []).map((ferramenta, idx) => (
                    <li key={idx} className="text-sm text-gray-900 dark:text-gray-200 flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-blue-500" />
                      {typeof ferramenta === 'string' ? ferramenta : ferramenta.nome}
                      {ferramenta.quantidade > 1 && ` (${ferramenta.quantidade})`}
                    </li>
                  ))}
                </ul>
              </div>

              {transferencia.observacoes && (
                <div className="mt-3 text-sm text-gray-900 dark:text-gray-200">
                  <strong>Observações:</strong> {transferencia.observacoes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransferenciasRecebidas;
