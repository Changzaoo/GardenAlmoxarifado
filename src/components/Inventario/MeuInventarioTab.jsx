import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import ListaMeuInventario from './ListaMeuInventario';
import TransferenciasRecebidas from '../Transferencias/TransferenciasRecebidas';
import { FuncionariosProvider } from '../Funcionarios/FuncionariosProvider';

const MeuInventarioTab = ({ emprestimos, readOnly = false, showEmptyMessage }) => {
  const { usuario } = useAuth();
  const [transferencias, setTransferencias] = useState([]);
  const [isLoadingTransferencias, setIsLoadingTransferencias] = useState(true);


  // Carregar transferências pendentes
  useEffect(() => {
    let unsubscribe = () => {};

    const carregarTransferencias = async () => {
      if (!usuario?.id) return;

      const q = query(
        collection(db, 'transferencias'),
        where('funcionarioDestinoId', '==', String(usuario.id)),
        where('status', '==', 'pendente')
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const transferenciasData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Transferências pendentes carregadas:', transferenciasData);
        setTransferencias(transferenciasData);
        setIsLoadingTransferencias(false);
      });
    };

    carregarTransferencias();
    return () => unsubscribe();
  }, [usuario]);

  console.log('MeuInventarioTab - Estado:', {
    'ID do usuário': usuario?.id,
    'Total de empréstimos recebidos': Array.isArray(emprestimos) ? emprestimos.length : 'N/A',
    'Empréstimos ativos': Array.isArray(emprestimos) 
      ? emprestimos.filter(emp => emp.status !== 'devolvido' && emp.status !== 'cancelado').length 
      : 'N/A',
    'Detalhes dos empréstimos': emprestimos,
    'Total de transferências': transferencias.length,
  });

  const renderConteudo = () => {
    if (!usuario && !readOnly) {
      return (
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 text-center shadow-md">
          <p className="text-gray-500 dark:text-gray-400">Você precisa estar logado para ver seus empréstimos.</p>
        </div>
      );
    }

    if (!Array.isArray(emprestimos)) {
      return (
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 text-center shadow-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1DA1F2] mx-auto"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Carregando empréstimos...</p>
        </div>
      );
    }

    return (
      <>
        {transferencias.length > 0 && (
          <div className="bg-[#192734] border border-[#38444D] hover:border-[#1DA1F2] rounded-xl p-4 mb-6 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold text-white">
                Transferências Pendentes ({transferencias.length})
              </h3>
            </div>
            <p className="text-sm text-[#8899A6] mb-4">
              Você tem ferramentas aguardando sua confirmação de recebimento.
            </p>
          </div>
        )}
        
        <ListaMeuInventario 
          emprestimos={emprestimos} 
          transferencias={transferencias}
          usuario={usuario} 
          isLoadingTransferencias={isLoadingTransferencias}
          showEmptyMessage={showEmptyMessage}
          readOnly={readOnly}
        />
      </>
    );
  };

  const content = (
    <div className="space-y-6">
      {renderConteudo()}
    </div>
  );

  if (readOnly) {
    return content;
  }

  return (
    <FuncionariosProvider>
      {content}
    </FuncionariosProvider>
  );
};

export default MeuInventarioTab;