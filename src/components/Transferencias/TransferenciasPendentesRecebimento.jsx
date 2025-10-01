import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Clock } from 'lucide-react';
import { formatarData } from '../../utils/dateUtils';

const TransferenciasPendentesRecebimento = ({ usuario }) => {
  const [transferencias, setTransferencias] = useState([]);

  useEffect(() => {
    if (!usuario?.id) return;

    const q = query(
      collection(db, 'transferencias'),
      where('funcionarioDestinoId', '==', String(usuario.id)),
      where('status', '==', 'pendente')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Transferências pendentes para recebimento:', docs);
      setTransferencias(docs);
    });

    return () => unsubscribe();
  }, [usuario?.id]);

  const handleAceitarTransferencia = async (transferencia) => {
    try {
      const docRef = doc(db, 'transferencias', transferencia.id);
      await updateDoc(docRef, {
        status: 'aceito',
        dataAceite: new Date().toISOString()
      });
      
      // Atualizar o empréstimo para refletir a transferência
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

  if (transferencias.length === 0) {
    return null;
  }

  return (
    <div className="bg-green-50 rounded-lg shadow-sm p-6 border border-green-200 mb-6">
      <h3 className="text-lg font-semibold text-green-800 mb-4">
        Transferências Pendentes para Sua Aprovação
      </h3>
      <div className="space-y-3">
        {transferencias.map(transferencia => (
          <div key={transferencia.id} className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900">
                  De: {transferencia.funcionarioOrigem}
                </p>
                <p className="text-sm text-gray-600">
                  Solicitado em: {formatarData(transferencia.dataSolicitacao)}
                </p>
                <div className="mt-2">
                  <p className="text-sm text-gray-700">Ferramentas:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {(transferencia.ferramentas || []).map((ferramenta, idx) => (
                      <li key={idx}>
                        {typeof ferramenta === 'string' ? ferramenta : ferramenta.nome}
                        {ferramenta.quantidade > 1 && ` (${ferramenta.quantidade})`}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-sm text-green-600 flex items-center gap-1 mb-2">
                  <Clock className="w-4 h-4" />
                  Aguardando sua aprovação
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAceitarTransferencia(transferencia)}
                    className="px-4 py-2 bg-green-600 text-gray-900 dark:text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Aceitar
                  </button>
                  <button
                    onClick={() => handleRecusarTransferencia(transferencia)}
                    className="px-4 py-2 bg-red-600 text-gray-900 dark:text-white rounded-md hover:bg-red-700 transition-colors"
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
  );
};

export default TransferenciasPendentesRecebimento;

