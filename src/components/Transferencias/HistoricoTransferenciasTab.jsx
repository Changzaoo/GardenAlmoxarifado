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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Histórico de Transferências</h1>
      
      {transferencias.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <ToolCase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma transferência registrada.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transferencias.map((transferencia, index) => (
            <div 
              key={`${transferencia.emprestimoId}-${index}`}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-600">De:</span>
                    <span className="font-medium text-gray-900">{transferencia.de}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Para:</span>
                    <span className="font-medium text-gray-900">{transferencia.para}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
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
                <div className="text-sm text-gray-500">
                  ID do Empréstimo: #{transferencia.emprestimoId.slice(-4)}
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Ferramentas:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {transferencia.ferramentas.map((ferramenta, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-2 bg-gray-50 p-2 rounded-md"
                    >
                      <ToolCase className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-800">
                        {typeof ferramenta === 'string' ? ferramenta : ferramenta.nome}
                        {typeof ferramenta !== 'string' && ferramenta.quantidade > 1 && 
                          ` (${ferramenta.quantidade})`
                        }
                      </span>
                      {typeof ferramenta !== 'string' && ferramenta.codigo && (
                        <span className="text-xs text-gray-500">
                          Código: {ferramenta.codigo}
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
