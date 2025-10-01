import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { ToolCase, ArrowRight, Calendar, Clock } from 'lucide-react';
import { formatarData } from '../../utils/dateUtils';

const HistoricoTransferenciasTab = () => {
  const [transferencias, setTransferencias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar todos os empréstimos que têm histórico de transferências
    const q = query(
      collection(db, 'emprestimos'),
      orderBy('dataUltimaTransferencia', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transferenciasData = [];
      snapshot.docs.forEach(doc => {
        const emprestimo = doc.data();
        if (emprestimo.historicoTransferencias?.length > 0) {
          emprestimo.historicoTransferencias.forEach(transferencia => {
            transferenciasData.push({
              id: doc.id,
              emprestimoId: doc.id,
              ...transferencia,
              ferramentas: emprestimo.ferramentas
            });
          });
        }
      });

      setTransferencias(transferenciasData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-[#1D9BF0]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transferencias.length === 0 ? (
        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-8 text-center">
          <ToolCase className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            Nenhuma transferência registrada
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            As transferências aparecerão aqui quando forem realizadas
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {transferencias.map((transferencia, index) => (
            <div 
              key={`${transferencia.emprestimoId}-${index}`}
              className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-600 dark:text-gray-300">De:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{transferencia.de}</span>
                    <ArrowRight className="w-4 h-4 text-blue-500 dark:text-[#1D9BF0]" />
                    <span className="text-gray-600 dark:text-gray-300">Para:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{transferencia.para}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatarData(transferencia.data)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(transferencia.data).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 bg-blue-100 dark:bg-[#1D9BF0] dark:bg-opacity-10 px-2 py-1 rounded-full">
                  #{transferencia.emprestimoId.slice(-4)}
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Ferramentas:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {transferencia.ferramentas.map((ferramenta, idx) => (
                    <div 
                      key={idx}
                      className="bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg flex items-center gap-2 p-2"
                    >
                      <ToolCase className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {typeof ferramenta === 'string' ? ferramenta : ferramenta.nome}
                        {typeof ferramenta !== 'string' && ferramenta.quantidade > 1 && 
                          ` (${ferramenta.quantidade})`
                        }
                      </span>
                      {typeof ferramenta !== 'string' && ferramenta.codigo && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {ferramenta.codigo}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoricoTransferenciasTab;
