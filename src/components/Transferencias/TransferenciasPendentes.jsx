import React, { useState, useEffect } from 'react';
import { collection, query, where, updateDoc, doc, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { formatarData } from '../../utils/dateUtils';
import { ArrowRight, CheckCircle, XCircle, Bell } from 'lucide-react';

const TransferenciasPendentes = ({ usuario }) => {
  const [transferencias, setTransferencias] = useState([]);

  useEffect(() => {
    if (!usuario?.id) return;

    // Buscar transferências onde o usuário é o destino
    const q = query(
      collection(db, 'transferencias'),
      where('funcionarioDestinoId', '==', usuario.id),
      where('status', '==', 'pendente')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transferenciasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransferencias(transferenciasData);
    });

    return () => unsubscribe();
  }, [usuario]);

  const handleAcao = async (transferencia, aceitar) => {
    try {
      const transferenciaRef = doc(db, 'transferencias', transferencia.id);
      const emprestimoRef = doc(db, 'emprestimos', transferencia.emprestimo);

      if (aceitar) {
        // Se for transferência de todas as ferramentas
        if (transferencia.ferramentas.length === transferencia.ferramentasOriginais.length) {
          // Atualizar empréstimo existente com novo responsável
          await updateDoc(emprestimoRef, {
            colaborador: transferencia.funcionarioDestino,
            funcionarioId: transferencia.funcionarioDestinoId,
            dataTransferencia: new Date().toISOString()
          });
        } else {
          // Criar novo empréstimo para as ferramentas transferidas
          await addDoc(collection(db, 'emprestimos'), {
            colaborador: transferencia.funcionarioDestino,
            funcionarioId: transferencia.funcionarioDestinoId,
            ferramentas: transferencia.ferramentas,
            dataRetirada: new Date().toISOString(),
            horaRetirada: new Date().toLocaleTimeString(),
            status: 'emprestado',
            dataDevolucao: null,
            horaDevolucao: null,
            observacoes: `Transferido de: ${transferencia.funcionarioOrigem}`
          });

          // Atualizar empréstimo original removendo as ferramentas transferidas
          const ferramentasRestantes = transferencia.ferramentasOriginais.filter(
            f => !transferencia.ferramentas.includes(f)
          );
          
          await updateDoc(emprestimoRef, {
            ferramentas: ferramentasRestantes
          });
        }

        // Atualizar status da transferência
        await updateDoc(transferenciaRef, {
          status: 'aprovada',
          dataAprovacao: new Date().toISOString()
        });

        alert('Transferência aceita com sucesso!');
      } else {
        // Rejeitar transferência
        await updateDoc(transferenciaRef, {
          status: 'rejeitada',
          dataRejeitada: new Date().toISOString()
        });

        alert('Transferência rejeitada.');
      }
    } catch (error) {
      console.error('Erro ao processar transferência:', error);
      alert('Erro ao processar transferência. Tente novamente.');
    }
  };

  if (transferencias.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg mb-6 border border-gray-200 dark:border-gray-600">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-yellow-600" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Transferências Pendentes
        </h3>
      </div>

      <div className="space-y-4">
        {transferencias.map((transferencia) => (
          <div key={transferencia.id} className="bg-gray-50 dark:bg-gray-600 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Solicitação de {transferencia.funcionarioOrigem}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Data: {formatarData(transferencia.dataSolicitacao)}
                </p>
                
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Ferramentas:</p>
                  <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1">
                    {transferencia.ferramentas.map((ferramenta, idx) => (
                      <div key={idx} className="text-sm text-gray-900 dark:text-gray-200">
                        {typeof ferramenta === 'string' ? ferramenta : ferramenta.nome}
                        {typeof ferramenta !== 'string' && ferramenta.quantidade > 1 && ` (${ferramenta.quantidade})`}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAcao(transferencia, true)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                  title="Aceitar transferência"
                >
                  <CheckCircle className="w-6 h-6" />
                </button>
                <button
                  onClick={() => handleAcao(transferencia, false)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                  title="Rejeitar transferência"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransferenciasPendentes;
